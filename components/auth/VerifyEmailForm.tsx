"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmailAction } from "@/actions/verifyEmail.action";

export default function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        if (!email) {
            setMessage("Email is missing.");
            return;
        }

        if (otp.length !== 6) {
            setMessage("Please enter a 6-digit code.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const result = await verifyEmailAction(
                email,
                otp
            );

            if (!result.success) {
                setMessage(result.message);
                return;
            }

            router.push("/");
            router.refresh();
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
                Verify your email
            </h1>

            <p className="mt-2 text-sm text-gray-600">
                We sent a 6-digit verification code to:
            </p>

            <p className="mt-1 font-medium">
                {email}
            </p>

            <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
            >
                <div>
                    <label
                        htmlFor="otp"
                        className="block text-sm font-medium"
                    >
                        Verification code
                    </label>

                    <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                            setOtp(
                                e.target.value.replace(
                                    /\D/g,
                                    ""
                                )
                            )
                        }
                        placeholder="Enter 6-digit code"
                        className="mt-1 w-full rounded-md border px-3 py-2"
                    />
                </div>

                {message && (
                    <p className="text-sm text-red-500">
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                    {loading
                        ? "Verifying..."
                        : "Verify Email"}
                </button>
            </form>
        </div>
    );
}