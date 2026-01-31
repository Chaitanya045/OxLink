import { createAuthClient } from "better-auth/react";

// The client needs to call the full URL including Next's basePath.
// `baseURL` includes basePath; `basePath` is the auth route path relative to that.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  basePath: "/oxlink/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;
