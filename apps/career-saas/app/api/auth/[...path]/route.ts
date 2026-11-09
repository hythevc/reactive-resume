import { proxyCloudRequest } from "@/lib/cloud-proxy";

type AuthRouteContext = { params: Promise<{ path: string[] }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request, context: AuthRouteContext) {
	return proxyCloudRequest(request, "auth", (await context.params).path, process.env.CAREEROS_BACKEND_URL);
}

export const GET = handle;
export const POST = handle;
