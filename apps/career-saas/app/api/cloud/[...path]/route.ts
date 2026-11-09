import { cloudConfiguration, proxyCloudRequest } from "@/lib/cloud-proxy";

type CloudRouteContext = { params: Promise<{ path: string[] }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request, context: CloudRouteContext) {
	const { path } = await context.params;
	if (request.method === "GET" && path.length === 1 && path[0] === "readiness") {
		const configuration = cloudConfiguration(process.env.CAREEROS_BACKEND_URL);
		return Response.json(configuration, {
			headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
		});
	}
	return proxyCloudRequest(request, "service", path, process.env.CAREEROS_BACKEND_URL);
}

export const GET = handle;
export const POST = handle;
