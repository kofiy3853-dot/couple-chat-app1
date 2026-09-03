"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import type { LoginFormData } from "@/components/auth/auth-form";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
      </div>

      <AuthForm
        mode="login"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-rose-500 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
