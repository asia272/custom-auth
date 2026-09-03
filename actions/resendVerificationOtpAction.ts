"use server";

import { sendVerificationOtpEmail } from "@/lib/email";
import { generateOtp, hashOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

// ========================================
// RESEND EMAIL VERIFICATION OTP
// ========================================

export async function resendVerificationOtpAction(
    email: string
) {
    try {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        // Don't reveal whether an account exists
        if (!user) {
            return {
                success: true,
                message:
                    "If an account exists, a verification code has been sent.",
            };
        }

        // 2. Check if email is already verified
        if (user.emailVerifiedAt) {
            return {
                success: false,
                message: "Your email is already verified. Please login.",
            };
        }

        // 3. Delete previous verification OTP
        await prisma.verificationToken.deleteMany({
            where: {
                userId: user.id,
                type: "EMAIL_VERIFICATION",
            },
        });

        // 4. Generate new OTP
        const otp = generateOtp();

        // 5. Hash OTP
        const tokenHash = hashOtp(otp);

        // 6. Save new OTP
        await prisma.verificationToken.create({
            data: {
                userId: user.id,
                type: "EMAIL_VERIFICATION",
                tokenHash,
                expiresAt: new Date(
                    Date.now() + 10 * 60 * 1000
                ),
            },
        });

        // 7. Send OTP through Brevo
        await sendVerificationOtpEmail(
            user.email,
            user.name,
            otp
        );

        return {
            success: true,
            message:
                "A new verification code has been sent to your email.",
        };
    } catch (error) {
        console.error(
            "Resend verification OTP error:",
            error
        );

        return {
            success: false,
            message:
                "Something went wrong. Please try again.",
        };
    }
}