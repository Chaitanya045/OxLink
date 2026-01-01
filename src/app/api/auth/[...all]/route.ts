import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

export const GET = async (req: Request) => {
  return handlers.GET(req);
};

export const POST = async (req: Request) => {
  return handlers.POST(req);
};
