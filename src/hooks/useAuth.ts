import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import type { LoginCredentials, SignUpCredentials } from "@/types/auth";

interface UseAuthReturn {
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  loginWithEmail: (credentials: LoginCredentials) => Promise<void>;
  signUpWithEmail: (credentials: SignUpCredentials) => Promise<void>;
  loginWithSocial: (provider: "google" | "github") => Promise<void>;
}

const CALLBACK_URL = "/dashboard";

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginWithEmail = useCallback(
    async (credentials: LoginCredentials) => {
      setError("");
      setLoading(true);

      try {
        await signIn.email({
          email: credentials.email,
          password: credentials.password,
          callbackURL: CALLBACK_URL,
        });
        router.push(CALLBACK_URL);
      } catch (err) {
        setError("Invalid email or password");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const signUpWithEmail = useCallback(
    async (credentials: SignUpCredentials) => {
      setError("");
      setLoading(true);

      try {
        await signUp.email({
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
          callbackURL: CALLBACK_URL,
        });
        router.push(CALLBACK_URL);
      } catch (err) {
        setError("Failed to create account. Email may already be in use.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const loginWithSocial = useCallback(
    async (provider: "google" | "github") => {
      setError("");
      try {
        await signIn.social({
          provider,
          callbackURL: CALLBACK_URL,
        });
      } catch (err) {
        const providerName = provider === "google" ? "Google" : "GitHub";
        setError(`Failed to sign in with ${providerName}`);
        throw err;
      }
    },
    []
  );

  return {
    loading,
    error,
    setError,
    loginWithEmail,
    signUpWithEmail,
    loginWithSocial,
  };
}
