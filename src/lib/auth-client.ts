import { createAuthClient } from "better-auth/react";
import { getPublicBaseUrl } from "@/lib/publicUrl";

export const authClient = createAuthClient({
  baseURL: getPublicBaseUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
