import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  // baseURL is just the origin. Better Auth uses this + basePath to construct URLs.
  // Next strips basePath from incoming requests, so we use origin only here.
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  // basePath defaults to "/api/auth" which matches the route at src/app/api/auth/[...all]/route.ts
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true, // Enable email/password auth
  },
  // Optional: Add social providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
