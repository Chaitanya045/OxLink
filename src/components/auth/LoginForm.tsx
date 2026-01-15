"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthTabs } from "./AuthTabs";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { AuthDivider } from "./AuthDivider";
import { AuthErrorMessage } from "./AuthErrorMessage";
import { PasswordField } from "./PasswordField";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { loading, error, loginWithEmail, loginWithSocial } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail({ email, password });
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithSocial("google");
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGitHubLogin = async () => {
    try {
      await loginWithSocial("github");
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Welcome back</h2>
        <p className="text-muted-foreground">
          Please enter your details to sign in.
        </p>
      </div>

      {/* Tab Buttons */}
      <AuthTabs activeTab="login" />

      {/* Social Login Buttons */}
      <SocialLoginButtons
        onGoogleLogin={handleGoogleLogin}
        onGitHubLogin={handleGitHubLogin}
      />

      {/* Divider */}
      <AuthDivider />

      {/* Error Message */}
      <AuthErrorMessage message={error} />

      {/* Email/Password Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10"
            />
          </div>
        </div>

        {/* Password Field */}
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </label>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Log In"
          )}
        </Button>
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-primary hover:underline font-medium"
        >
          Sign up for free
        </Link>
      </p>
    </div>
  );
}
