"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import type { RegisterFormData } from "@/components/auth/auth-form";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message || "Registration failed.");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create account</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Start your journey together</p>
      </div>

      <AuthForm
        mode="register"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-rose-500 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
