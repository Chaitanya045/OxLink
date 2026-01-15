"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthTabs } from "./AuthTabs";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { AuthDivider } from "./AuthDivider";
import { AuthErrorMessage } from "./AuthErrorMessage";
import { PasswordField } from "./PasswordField";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { loading, error, signUpWithEmail, loginWithSocial } = useAuth();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeToTerms) {
      return;
    }

    try {
      await signUpWithEmail({ name, email, password });
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await loginWithSocial("google");
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGitHubSignUp = async () => {
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
        <h2 className="text-3xl font-bold">Create an account</h2>
        <p className="text-muted-foreground">
          Get started with OxLink for free.
        </p>
      </div>

      {/* Tab Buttons */}
      <AuthTabs activeTab="signup" />

      {/* Social Sign Up Buttons */}
      <SocialLoginButtons
        onGoogleLogin={handleGoogleSignUp}
        onGitHubLogin={handleGitHubSignUp}
      />

      {/* Divider */}
      <AuthDivider />

      {/* Error Message */}
      <AuthErrorMessage message={error} />

      {/* Sign Up Form */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="pl-10"
            />
          </div>
        </div>

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
          minLength={8}
        />

        {/* Terms & Conditions */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
          />
          <label
            htmlFor="terms"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="text-primary hover:underline font-medium"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
