export const tools = [
	{
		slug: "resume",
		output: "A resume version, live preview and printable document.",
		closing: "Put your experience on the page.",
		name: "Resume builder",
		hash: "resumes",
		title: "Build a resume for each role.",
		description:
			"Turn your career facts into a clear resume, with a live preview and versions for the roles you choose.",
		intro:
			"Start with your experience, skills and education. Keep a master version, then make a separate resume for an opportunity without rewriting your career history.",
		steps: [
			"Add your career facts or import supported Reactive Resume JSON.",
			"Create a version, edit your sections and compare the document preview.",
			"Export JSON or use your browser’s print dialog to save a PDF.",
		],
		includes: [
			"Editable career profile and independent resume versions",
			"Live document preview and local keyword comparison",
			"Supported Reactive Resume JSON import and export",
			"Browser print layout for Save as PDF",
		],
		limit:
			"Keyword coverage is a local text comparison, not an ATS score or hiring prediction. Browser printing is separate from Reactive Resume’s shared PDF and DOCX services.",
		action: "Build your resume",
	},
	{
		slug: "linkedin",
		output: "Editable headline, about, experience and skills drafts.",
		closing: "Make your next profile edit.",
		name: "LinkedIn review",
		hash: "linkedin",
		title: "Review your LinkedIn writing.",
		description:
			"Review the writing in your headline, about section, experience and skills, then shape a stronger introduction.",
		intro:
			"Bring the text you want to review, or start from a saved resume. See explained writing checks and work on an editable draft alongside your source.",
		steps: [
			"Paste your profile text or choose a saved resume.",
			"Review the writing checklist and section-level suggestions.",
			"Edit your draft and copy the text you decide to use.",
		],
		includes: [
			"Separate headline, about, experience and skills fields",
			"Explained local writing checks",
			"Editable suggestions and drafts",
			"Shared career facts without automatic publishing",
		],
		limit:
			"CareerOS does not sign in to LinkedIn, scrape your profile or publish changes. Its checks describe the text you supply; they do not predict profile ranking.",
		action: "Review your profile",
	},
	{
		slug: "photo",
		output: "A square PNG with a circle framing preview.",
		closing: "Prepare a photo you already have.",
		name: "Profile photo",
		hash: "photo",
		title: "Crop and adjust your profile photo.",
		description:
			"Crop and adjust a photo you already have, preview its framing and download a profile-ready square PNG.",
		intro:
			"Use a photo that represents you. Make simple visual adjustments in your browser and compare the result with your original before downloading it.",
		steps: [
			"Choose your own photo from your device.",
			"Adjust the crop and appearance, with square and circle previews.",
			"Compare the original and edited image, then download the square PNG.",
		],
		includes: [
			"Local image processing in your browser",
			"Crop and appearance controls",
			"Original and edited comparisons",
			"Square PNG download and circle framing preview",
		],
		limit:
			"This tool edits your photo; it does not generate AI headshots. Images and adjustments are not saved in your workspace backup and are discarded when you leave the editor.",
		action: "Prepare your photo",
	},
	{
		slug: "applications",
		output: "Saved postings, document drafts and your next action.",
		closing: "Bring your application records together.",
		name: "Applications",
		hash: "jobs",
		title: "Track each role and its documents.",
		description:
			"Keep saved roles, fit notes, documents and application stages together, with a deliberate review before you share.",
		intro:
			"Save a real posting, compare it with your career facts and prepare editable documents for that role. Keep track of what you have done and what needs your attention next.",
		steps: [
			"Save a posting and choose your source profile or resume.",
			"Compare explicit terms and prepare editable resume and cover-letter drafts.",
			"Review the documents yourself, optionally use the agent handoff, and record your own next step.",
		],
		includes: [
			"Saved jobs, search, stage filters and notes",
			"Local fit comparison and job-specific drafts",
			"Review-packet export and reviewed-draft import",
			"Preparation limits, location preferences and company exclusions",
		],
		limit:
			"Preparation runs while you use the app. CareerOS does not collect live jobs, autofill forms, submit applications or run a background scheduler. Applied and interview stages are your records.",
		action: "Organize your applications",
	},
	{
		slug: "outreach",
		output: "Contact notes and a message ready for your review.",
		closing: "Write your next introduction.",
		name: "Recruiter outreach",
		hash: "outreach",
		title: "Prepare your recruiter outreach.",
		description:
			"Keep the people, source notes and message drafts behind your search in one place, ready for your review.",
		intro:
			"Add contacts you have researched, keep the reason for reaching out beside their details, and write a message from supplied career facts. You choose what leaves your workspace.",
		steps: [
			"Add a contact, an optional source URL and your context.",
			"Prepare a template draft, then make it your own.",
			"Copy the message or open your email composer, and record the outcome yourself.",
		],
		includes: [
			"Contact details with user-supplied source and context",
			"Personalized, editable template drafts",
			"Manual copy and email-compose actions",
			"Draft, contacted and replied tracking",
		],
		limit:
			"CareerOS does not discover contacts, verify email addresses, send messages or sync replies. Contacted and replied labels are user reports, not delivery receipts.",
		action: "Prepare your outreach",
	},
	{
		slug: "role-discovery",
		output: "A career brief and a shortlist of roles you saved.",
		closing: "Consider the roles you have saved.",
		name: "Role discovery",
		hash: "discovery",
		title: "Review saved roles against your goals.",
		description:
			"Put what matters to you into words, then review saved roles one at a time with a clearer sense of direction.",
		intro:
			"Describe the problems, team, scope and environment you want next. Use that brief to reflect on the postings you save, without treating a keyword check as a career decision.",
		steps: [
			"Write a career brief about the work and environment you want.",
			"Review an eligible saved role and shortlist or pass with a reason.",
			"Prepare a company-specific introduction from facts you provide.",
		],
		includes: [
			"Editable career brief and preferences",
			"One saved role at a time",
			"Shortlist and pass decisions, separate from application stages",
			"Editable introductions and manual copying",
		],
		limit:
			"Role discovery works with postings you save. It is not a live job feed, AI recruiter or employer network. Passing on a role keeps it out of draft preparation.",
		action: "Review your saved roles",
	},
] as const;

export type MarketingTool = (typeof tools)[number];
