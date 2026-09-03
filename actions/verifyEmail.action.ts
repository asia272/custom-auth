import { hashOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function verifyEmailAction(
    email: string,
    otp: string
) {
    try {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            return {
                success: false,
                message: "Invalid verification request.",
            };
        }

        // 2. Already verified
        if (user.emailVerifiedAt) {
            return {
                success: false,
                message: "Email is already verified.",
            };
        }

        // 3. Find latest verification token
        const verificationToken =
            await prisma.verificationToken.findFirst({
                where: {
                    userId: user.id,
                    type: "EMAIL_VERIFICATION",
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

        if (!verificationToken) {
            return {
                success: false,
                message: "Verification code not found.",
            };
        }

        // 4. Check expiration
        if (verificationToken.expiresAt < new Date()) {
            await prisma.verificationToken.delete({
                where: {
                    id: verificationToken.id,
                },
            });

            return {
                success: false,
                message: "Verification code has expired.",
            };
        }

        // 5. Check attempts
        if (verificationToken.attempts >= 5) {
            await prisma.verificationToken.delete({
                where: {
                    id: verificationToken.id,
                },
            });

            return {
                success: false,
                message: "Too many incorrect attempts.",
            };
        }

        // 6. Hash submitted OTP
        const submittedOtpHash = hashOtp(otp);

        // 7. Compare
        if (
            submittedOtpHash !==
            verificationToken.tokenHash
        ) {
            await prisma.verificationToken.update({
                where: {
                    id: verificationToken.id,
                },
                data: {
                    attempts: {
                        increment: 1,
                    },
                },
            });

            return {
                success: false,
                message: "Invalid verification code.",
            };
        }

        // 8. Mark email verified
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                emailVerifiedAt: new Date(),
            },
        });

        // 9. Delete used OTP
        await prisma.verificationToken.delete({
            where: {
                id: verificationToken.id,
            },
        });

        // 10. Create session
        await createSession(user.id);

        return {
            success: true,
            message: "Email verified successfully.",
        };
    } catch (error) {
        console.error("Email verification error:", error);

        return {
            success: false,
            message: "Something went wrong.",
        };
    }
}