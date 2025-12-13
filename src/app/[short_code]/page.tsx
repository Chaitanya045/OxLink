import { redirect } from "next/navigation";
import { db } from "@/db";
import { urls } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export default async function ShortCodePage({
  params,
}: {
  params: Promise<{ short_code: string }>;
}) {
  const { short_code } = await params;

  // Find URL by short code or custom alias
  const [urlRecord] = await db
    .select()
    .from(urls)
    .where(
      or(eq(urls.shortCode, short_code), eq(urls.customAlias, short_code))
    )
    .limit(1);

  // If URL not found
  if (!urlRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground">
            Short URL &quot;{short_code}&quot; not found
          </p>
        </div>
      </div>
    );
  }

  // Check if URL has expired
  if (urlRecord.expiryDate && new Date(urlRecord.expiryDate) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">410</h1>
          <p className="text-muted-foreground">
            This short URL has expired
          </p>
        </div>
      </div>
    );
  }

  // Redirect to original URL
  redirect(urlRecord.originalUrl);
}
