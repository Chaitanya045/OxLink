import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  // baseURL is just the origin (no path).
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  // basePath defaults to "/api/auth" - this matches incoming requests after Next.js strips its basePath.
  // DO NOT set this to "/oxlink/api/auth" as it would break request matching.
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Explicitly set redirectURI to include Next.js basePath for OAuth callbacks
      redirectURI: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/oxlink/api/auth/callback/google`,
    },
  },
});
