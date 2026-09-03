"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPasswordAction } from "@/actions/resetPassword.action";

export default function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

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
            setMessage("Enter a valid 6-digit code.");
            return;
        }

        if (password.length < 8) {
            setMessage(
                "Password must be at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const result =
                await resetPasswordAction(
                    email,
                    otp,
                    password
                );

            if (!result.success) {
                setMessage(result.message);
                return;
            }

            router.push("/auth");
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
                Reset your password
            </h1>

            <p className="mt-2 text-sm text-gray-600">
                Enter the code sent to:
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
                        Reset code
                    </label>

                    <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) =>
                            setOtp(
                                e.target.value.replace(
                                    /\D/g,
                                    ""
                                )
                            )
                        }
                        placeholder="6-digit code"
                        className="mt-1 w-full rounded-md border px-3 py-2"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium"
                    >
                        New password
                    </label>

                    <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="New password"
                        className="mt-1 w-full rounded-md border px-3 py-2"
                    />
                </div>

                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium"
                    >
                        Confirm password
                    </label>

                    <input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(
                                e.target.value
                            )
                        }
                        placeholder="Confirm password"
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
                        ? "Resetting..."
                        : "Reset Password"}
                </button>
            </form>
        </div>
    );
}