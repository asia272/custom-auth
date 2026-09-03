"use server";

import { hashOtp } from "@/lib/otp";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

// ========================================


export async function resetPasswordAction(
    email: string,
    otp: string,
    newPassword: string
) {
    try {
        // 1. Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // 2. Find user
        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            return {
                success: false,
                message: "Invalid password reset request.",
            };
        }

        // 3. Find password reset token
        const resetToken =
            await prisma.verificationToken.findFirst({
                where: {
                    userId: user.id,
                    type: "PASSWORD_RESET",
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

        if (!resetToken) {
            return {
                success: false,
                message: "Reset code not found.",
            };
        }

        // 4. Check expiration
        if (resetToken.expiresAt < new Date()) {
            await prisma.verificationToken.delete({
                where: {
                    id: resetToken.id,
                },
            });

            return {
                success: false,
                message: "Reset code has expired.",
            };
        }

        // 5. Check maximum attempts
        if (resetToken.attempts >= 5) {
            await prisma.verificationToken.delete({
                where: {
                    id: resetToken.id,
                },
            });

            return {
                success: false,
                message: "Too many incorrect attempts.",
            };
        }

        // 6. Hash submitted OTP
        const submittedOtpHash = hashOtp(otp);

        // 7. Compare OTP
        if (submittedOtpHash !== resetToken.tokenHash) {
            await prisma.verificationToken.update({
                where: {
                    id: resetToken.id,
                },
                data: {
                    attempts: {
                        increment: 1,
                    },
                },
            });

            return {
                success: false,
                message: "Invalid reset code.",
            };
        }

        // 8. Validate new password
        if (newPassword.length < 8) {
            return {
                success: false,
                message:
                    "Password must be at least 8 characters.",
            };
        }

        // 9. Hash new password
        const passwordHash =
            await hashPassword(newPassword);

        // 10. Update password
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                passwordHash,
            },
        });

        // 11. Delete used reset token
        await prisma.verificationToken.delete({
            where: {
                id: resetToken.id,
            },
        });

        // 12. Invalidate all existing sessions
        await prisma.session.deleteMany({
            where: {
                userId: user.id,
            },
        });

        return {
            success: true,
            message:
                "Password reset successfully. Please log in again.",
        };
    } catch (error) {
        console.error(
            "Reset password error:",
            error
        );

        return {
            success: false,
            message: "Something went wrong.",
        };
    }
}