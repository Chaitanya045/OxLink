import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10) || 10));
  const search = url.searchParams.get("search")?.trim() || "";
  const status = url.searchParams.get("status")?.trim() || "all";
  const sortBy = url.searchParams.get("sortBy")?.trim() || "date";
  const sortOrder = url.searchParams.get("sortOrder")?.trim() || "desc";

  const origin = url.origin;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const sendComment = (comment: string) => {
        controller.enqueue(encoder.encode(`: ${comment}\n\n`));
      };

      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      const fetchJson = async (path: string) => {
        const res = await fetch(`${origin}${path}`, {
          headers: {
            cookie: req.headers.get("cookie") || "",
          },
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Upstream request failed: ${path} (${res.status})`);
        }
        return res.json();
      };

      try {
        const query = new URLSearchParams();
        query.set("page", String(page));
        query.set("limit", String(limit));
        if (search) query.set("search", search);
        if (status && status !== "all") query.set("status", status);
        query.set("sortBy", sortBy);
        query.set("sortOrder", sortOrder);

        const sendSnapshot = async () => {
          const [nextUrlsRes, nextStatsRes] = await Promise.all([
            fetchJson(`/api/urls?${query.toString()}`),
            fetchJson("/api/urls/stats"),
          ]);

          send("snapshot", {
            urls: nextUrlsRes.data,
            pagination: nextUrlsRes.pagination,
            stats: {
              totalClicks: nextStatsRes.totalClicks || 0,
              topPerforming: nextStatsRes.topPerforming || null,
            },
            lastUpdated: new Date().toISOString(),
          });
        };

        await sendSnapshot();

        sendComment("keep-alive");

        const keepAlive = setInterval(() => {
          if (closed) {
            clearInterval(keepAlive);
            return;
          }
          sendComment("keep-alive");
        }, 25000);

        const poll = setInterval(async () => {
          if (closed) {
            clearInterval(poll);
            return;
          }
          try {
            await sendSnapshot();
          } catch {
            // keep stream alive; next tick will retry
          }
        }, 30000);

        req.signal.addEventListener(
          "abort",
          () => {
            clearInterval(keepAlive);
            clearInterval(poll);
            close();
          },
          { once: true }
        );
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Unknown error",
        });
        close();
      }
    },
    cancel() {
      // client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
