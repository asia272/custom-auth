"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forgotPasswordAction } from "@/actions/auth.actions";

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const result =
        await forgotPasswordAction(email);

      setMessage(result.message);

      if (result.success) {
        router.push(
          `/auth/reset-password?email=${encodeURIComponent(
            email
          )}`
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold">
        Forgot password?
      </h1>

      <p className="mt-2 text-sm text-gray-600">
        Enter your email and we'll send you a
        password reset code.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="you@example.com"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        {message && (
          <p className="text-sm text-gray-600">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading
            ? "Sending..."
            : "Send Reset Code"}
        </button>
      </form>
    </div>
  );
}