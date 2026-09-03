"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmailAction } from "@/actions/verifyEmail.action";
import { resendVerificationOtpAction } from "@/actions/resendVerificationOtpAction";


export default function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
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

    async function handleResendOtp() {
        if (!email) {
            setMessage("Email is missing.");
            return;
        }

        try {
            setResending(true);
            setMessage("");

            const result =
                await resendVerificationOtpAction(email);

            setMessage(result.message);
        } catch (error) {
            console.error(error);
            setMessage("Something went wrong.");
        } finally {
            setResending(false);
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
                    <p className="text-sm text-gray-600">
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || resending}
                    className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                    {loading
                        ? "Verifying..."
                        : "Verify Email"}
                </button>
            </form>

            {/* RESEND OTP */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Didn't receive the code?
                </p>

                <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending || loading}
                    className="mt-2 text-sm font-medium underline disabled:opacity-50"
                >
                    {resending
                        ? "Sending..."
                        : "Resend Code"}
                </button>
            </div>
        </div>
    );
}