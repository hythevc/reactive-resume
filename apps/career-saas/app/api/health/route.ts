export const dynamic = "force-dynamic";

export function GET() {
	return Response.json(
		{
			status: "ok",
			application: "careeros",
			version: "0.3.0",
			commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
		},
		{ headers: { "Cache-Control": "no-store" } },
	);
}
