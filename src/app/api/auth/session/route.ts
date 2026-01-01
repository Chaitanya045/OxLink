import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = async (req: Request) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  return Response.json(session || null);
};
