"use client";

import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignUpForm({ merchant }: { merchant: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, merchant }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sign up failed");

        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError("Account created but sign in failed. Please sign in.");
          setLoading(false);
          return;
        }

        router.push(`/${merchant}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign up failed");
        setLoading(false);
      }
    },
    [name, email, password, merchant, router]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <a
          href={`/${merchant}/auth/signin`}
          className="font-medium text-brand-600 hover:text-brand-500"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
