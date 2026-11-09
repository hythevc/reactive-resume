-- DESIGN DRAFT ONLY: not applied, not registered with Drizzle, not a production migration.
-- Map profile/resume/application entities to existing packages/db schemas before integration.
-- Requires existing Better Auth public."user" with text primary keys; PostgreSQL 15+.
-- Runtime must use a non-owner role without BYPASSRLS and trusted transaction-local identity.
-- Provision memberships, billing, receipts and worker states through authorized server services.
BEGIN;

CREATE SCHEMA career_saas;
REVOKE ALL ON SCHEMA career_saas FROM PUBLIC;

CREATE FUNCTION career_saas.actor_id() RETURNS text
LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id', true), '') $$;
CREATE FUNCTION career_saas.tenant_id() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.org_id', true), '')::uuid $$;

CREATE TABLE career_saas.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL REFERENCES public."user"(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX organizations_owner_idx ON career_saas.organizations(owner_user_id);

CREATE TABLE career_saas.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','member','viewer')),
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id,user_id)
);
CREATE INDEX memberships_user_org_idx ON career_saas.memberships(user_id,org_id,state);
CREATE UNIQUE INDEX memberships_one_owner_idx ON career_saas.memberships(org_id) WHERE role='owner' AND state='active';

-- Invoker function: memberships has a simple self-read policy, avoiding recursive RLS.
-- Server validates session then sets both context values within EACH database transaction.
CREATE FUNCTION career_saas.member_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT role FROM career_saas.memberships
  WHERE org_id=career_saas.tenant_id() AND user_id=career_saas.actor_id() AND state='active'
$$;

-- Shared artifact envelope: kind-specific JSON must also pass versioned application schemas.
-- resume/profile kinds map to existing production tables rather than becoming duplicates.
CREATE TABLE career_saas.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('profile','resume','linkedin_review','photo_source','photo_output')),
  title text NOT NULL DEFAULT '',
  revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data)='object'),
  source_artifact_id uuid,
  input_digest text,
  engine_version text,
  object_key text, -- private storage key, never a permanent public photo URL
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,user_id,id),
  FOREIGN KEY(org_id,user_id,source_artifact_id) REFERENCES career_saas.artifacts(org_id,user_id,id) ON DELETE NO ACTION
);
CREATE INDEX artifacts_owner_kind_date_idx ON career_saas.artifacts(org_id,user_id,kind,created_at DESC,id);
CREATE INDEX artifacts_source_idx ON career_saas.artifacts(org_id,user_id,source_artifact_id);
CREATE INDEX artifacts_expiry_idx ON career_saas.artifacts(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE career_saas.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  company text NOT NULL, role text NOT NULL, location text NOT NULL DEFAULT '',
  source_url text, description text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
  salary_min_cents bigint CHECK (salary_min_cents>=0),
  salary_max_cents bigint CHECK (salary_max_cents>=salary_min_cents),
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,user_id,id)
);
CREATE INDEX jobs_owner_date_idx ON career_saas.jobs(org_id,user_id,created_at DESC,id);

CREATE TABLE career_saas.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  job_id uuid NOT NULL, resume_artifact_id uuid,
  state text NOT NULL DEFAULT 'saved' CHECK (state IN ('saved','matched','prepared','approved','submitting','submitted','unknown','failed','cancelled')),
  hiring_stage text NOT NULL DEFAULT 'none' CHECK (hiring_stage IN ('none','interview','offer','rejected','withdrawn')),
  input_revision integer NOT NULL DEFAULT 1 CHECK (input_revision>0),
  approved_digest text, approved_at timestamptz,
  confirmation_source text CHECK (confirmation_source IN ('provider','manual')),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,user_id,id), UNIQUE(org_id,user_id,job_id),
  FOREIGN KEY(org_id,user_id,job_id) REFERENCES career_saas.jobs(org_id,user_id,id) ON DELETE CASCADE,
  FOREIGN KEY(org_id,user_id,resume_artifact_id) REFERENCES career_saas.artifacts(org_id,user_id,id) ON DELETE NO ACTION,
  CHECK (state<>'submitted' OR (confirmed_at IS NOT NULL AND confirmation_source IS NOT NULL)),
  CHECK (state NOT IN ('approved','submitting') OR (approved_digest IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE INDEX applications_owner_state_idx ON career_saas.applications(org_id,user_id,state,created_at DESC,id);
CREATE INDEX applications_resume_idx ON career_saas.applications(org_id,user_id,resume_artifact_id);

CREATE TABLE career_saas.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  name text NOT NULL, company text NOT NULL DEFAULT '', role text NOT NULL DEFAULT '', email text,
  source_url text, verification_state text NOT NULL DEFAULT 'unverified' CHECK (verification_state IN ('unverified','verified','invalid','unknown')),
  verified_at timestamptz, opted_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,user_id,id)
);
CREATE INDEX contacts_owner_name_idx ON career_saas.contacts(org_id,user_id,name,id);

CREATE TABLE career_saas.outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL, subject text NOT NULL DEFAULT '', body text NOT NULL,
  revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','approved','queued','sending','sent','delivered','bounced','replied','unknown','failed','cancelled')),
  approved_digest text, approved_at timestamptz, provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,user_id,id),
  FOREIGN KEY(org_id,user_id,contact_id) REFERENCES career_saas.contacts(org_id,user_id,id) ON DELETE CASCADE,
  CHECK (state NOT IN ('approved','queued','sending') OR (approved_digest IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK (state NOT IN ('sent','delivered','bounced','replied') OR provider_message_id IS NOT NULL)
);
CREATE INDEX outreach_owner_state_idx ON career_saas.outreach_messages(org_id,user_id,state,created_at DESC,id);
CREATE INDEX outreach_contact_idx ON career_saas.outreach_messages(org_id,user_id,contact_id);

CREATE TABLE career_saas.automation_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  name text NOT NULL, enabled boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'prepare' CHECK (mode IN ('prepare','approved_delivery')),
  daily_limit integer NOT NULL DEFAULT 5 CHECK (daily_limit BETWEEN 1 AND 100),
  timezone text NOT NULL DEFAULT 'UTC', -- validate against IANA database in service
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,user_id,id)
);
CREATE INDEX automation_owner_enabled_idx ON career_saas.automation_policies(org_id,user_id,enabled);

CREATE TABLE career_saas.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('review','photo','prepare_application','submit_application','send_outreach')),
  application_id uuid, message_id uuid, artifact_id uuid,
  idempotency_key text NOT NULL, approved_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','leased','succeeded','failed','unknown','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts>=0),
  available_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, lease_token uuid,
  failure_code text, -- no credentials or raw provider responses
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,user_id,id), UNIQUE(org_id,user_id,kind,idempotency_key),
  FOREIGN KEY(org_id,user_id,application_id) REFERENCES career_saas.applications(org_id,user_id,id) ON DELETE CASCADE,
  FOREIGN KEY(org_id,user_id,message_id) REFERENCES career_saas.outreach_messages(org_id,user_id,id) ON DELETE CASCADE,
  FOREIGN KEY(org_id,user_id,artifact_id) REFERENCES career_saas.artifacts(org_id,user_id,id) ON DELETE CASCADE,
  CHECK (num_nonnulls(application_id,message_id,artifact_id)=1),
  CHECK ((state='leased' AND lease_until IS NOT NULL AND lease_token IS NOT NULL)
      OR (state<>'leased' AND lease_until IS NULL AND lease_token IS NULL))
);
CREATE INDEX tasks_queue_idx ON career_saas.tasks(state,available_at,lease_until) WHERE state IN ('queued','leased');
CREATE INDEX tasks_application_idx ON career_saas.tasks(org_id,user_id,application_id);
CREATE INDEX tasks_message_idx ON career_saas.tasks(org_id,user_id,message_id);
CREATE INDEX tasks_artifact_idx ON career_saas.tasks(org_id,user_id,artifact_id);
CREATE INDEX tasks_owner_date_idx ON career_saas.tasks(org_id,user_id,created_at DESC,id);

CREATE TABLE career_saas.delivery_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  task_id uuid NOT NULL, provider text NOT NULL, provider_event_id text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('accepted','submitted','delivered','bounced','replied','unknown','failed')),
  evidence_digest text NOT NULL, occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider,provider_event_id),
  FOREIGN KEY(org_id,user_id,task_id) REFERENCES career_saas.tasks(org_id,user_id,id) ON DELETE CASCADE
);
CREATE INDEX receipts_owner_task_idx ON career_saas.delivery_receipts(org_id,user_id,task_id,occurred_at DESC);

CREATE TABLE career_saas.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  hostname text NOT NULL CHECK (hostname=lower(hostname)),
  token_digest text NOT NULL, -- retain only digest; DNS challenge checked server-side
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','verified','suspended','removed')),
  verified_at timestamptz, last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (state<>'verified' OR verified_at IS NOT NULL)
);
CREATE INDEX domains_org_idx ON career_saas.domains(org_id);
CREATE UNIQUE INDEX domains_verified_host_idx ON career_saas.domains(hostname) WHERE state='verified';

CREATE TABLE career_saas.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  state text NOT NULL DEFAULT 'inactive' CHECK (state IN ('inactive','trial','active','past_due','cancelled')),
  provider_customer_id text UNIQUE, provider_subscription_id text UNIQUE,
  photo_credits integer NOT NULL DEFAULT 0 CHECK (photo_credits>=0),
  price_cents integer CHECK (price_cents>=0), currency char(3) CHECK (currency ~ '^[A-Z]{3}$'),
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

CREATE TABLE career_saas.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES career_saas.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL, provider_event_id text NOT NULL,
  payload_digest text NOT NULL, processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider,provider_event_id)
);
CREATE INDEX webhook_org_idx ON career_saas.webhook_events(org_id,created_at DESC);

-- RLS is additional isolation, not business-state authorization.
-- Ordinary app role gets only explicitly granted tables/columns during actual integration.
ALTER TABLE career_saas.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_saas.memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY memberships_self ON career_saas.memberships FOR SELECT
  USING (org_id=career_saas.tenant_id() AND user_id=career_saas.actor_id());
-- No ordinary membership mutation policy. Provisioning service enforces owner/invite rules.

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['organizations','domains','entitlements','webhook_events'] LOOP
    EXECUTE format('ALTER TABLE career_saas.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('ALTER TABLE career_saas.%I FORCE ROW LEVEL SECURITY',table_name);
  END LOOP;
END $$;
CREATE POLICY organization_read ON career_saas.organizations FOR SELECT
  USING (id=career_saas.tenant_id() AND career_saas.member_role() IS NOT NULL);
CREATE POLICY domains_admin_read ON career_saas.domains FOR SELECT
  USING (org_id=career_saas.tenant_id() AND career_saas.member_role() IN ('owner','admin'));
CREATE POLICY entitlement_read ON career_saas.entitlements FOR SELECT
  USING (org_id=career_saas.tenant_id() AND career_saas.member_role() IS NOT NULL);
-- Webhook records have no ordinary read/write policy. Signed server handlers own them.

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['artifacts','jobs','applications','contacts','outreach_messages','automation_policies','tasks','delivery_receipts'] LOOP
    EXECUTE format('ALTER TABLE career_saas.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('ALTER TABLE career_saas.%I FORCE ROW LEVEL SECURITY',table_name);
    EXECUTE format('CREATE POLICY own_read ON career_saas.%I FOR SELECT USING (org_id=career_saas.tenant_id() AND user_id=career_saas.actor_id() AND career_saas.member_role() IS NOT NULL)',table_name);
    IF table_name NOT IN ('tasks','delivery_receipts') THEN
      EXECUTE format('CREATE POLICY own_insert ON career_saas.%I FOR INSERT WITH CHECK (org_id=career_saas.tenant_id() AND user_id=career_saas.actor_id() AND career_saas.member_role() IN (''owner'',''admin'',''member''))',table_name);
      EXECUTE format('CREATE POLICY own_update ON career_saas.%I FOR UPDATE USING (org_id=career_saas.tenant_id() AND user_id=career_saas.actor_id() AND career_saas.member_role() IN (''owner'',''admin'',''member'')) WITH CHECK (org_id=career_saas.tenant_id() AND user_id=career_saas.actor_id() AND career_saas.member_role() IN (''owner'',''admin'',''member''))',table_name);
      EXECUTE format('CREATE POLICY own_delete ON career_saas.%I FOR DELETE USING (org_id=career_saas.tenant_id() AND user_id=career_saas.actor_id() AND career_saas.member_role() IN (''owner'',''admin'',''member''))',table_name);
    END IF;
  END LOOP;
END $$;

CREATE FUNCTION career_saas.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
DO $$ DECLARE table_name text; BEGIN
  FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname='career_saas' LOOP
    EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON career_saas.%I FOR EACH ROW EXECUTE FUNCTION career_saas.touch_updated_at()',table_name);
  END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA career_saas FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA career_saas FROM PUBLIC;
-- Follow-up: explicit least-privilege grants, state-transition service contracts, retention policies,
-- two-user/two-org isolation tests, pooled identity tests and existing-entity mapping before use.
COMMIT;
