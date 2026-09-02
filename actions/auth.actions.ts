// actions/auth.actions.ts

"use server";


import { sendPasswordResetOtpEmail, sendVerificationOtpEmail } from "@/lib/email";
import { generateOtp, hashOtp } from "@/lib/otp";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
    createSession,
    deleteCurrentSession,
} from "@/lib/session";


// ========================================
// SIGNUP ACTION
// ========================================

// export async function signupAction(
//     name: string,
//     email: string,
//     password: string
// ) {
//     try {
//         // Normalize email
//         const normalizedEmail = email.trim().toLowerCase();

//         // 1. Check whether user already exists
//         const existingUser = await prisma.user.findUnique({
//             where: {
//                 email: normalizedEmail,
//             },
//         });

//         // 2. If user exists, stop registration
//         if (existingUser) {
//             return {
//                 success: false,
//                 message: "User already exists with this email. Try another email.",
//             };
//         }

//         // 3. Hash password
//         const passwordHash = await hashPassword(password);

//         // 4. Create user
//         const user = await prisma.user.create({
//             data: {
//                 name: name.trim(),
//                 email: normalizedEmail,
//                 passwordHash,
//             },
//         });
//         await createSession(user.id);
//         return {
//             success: true,
//             message: "Account created successfully.",
//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//             },
//         };
//     } catch (error) {
//         console.error("Signup error:", error);

//         return {
//             success: false,
//             message: "Something went wrong. Please try again.",
//         };
//     }
// }
export async function signupAction(
    name: string,
    email: string,
    password: string
) {
    try {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Check existing user
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (existingUser) {
            return {
                success: false,
                message: "User already exists with this email.",
            };
        }

        // 2. Hash password
        const passwordHash = await hashPassword(password);

        // 3. Create user
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
            },
        });

        // 4. Generate OTP
        const otp = generateOtp();

        // 5. Hash OTP
        const tokenHash = hashOtp(otp);

        // 6. Save OTP hash
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

        // 7. Send OTP using Brevo
        await sendVerificationOtpEmail(
            user.email,
            user.name,
            otp
        );

        // IMPORTANT:
        // No session here.

        return {
            success: true,
            message: "Verification code sent to your email.",
        };
    } catch (error) {
        console.error("Signup error:", error);

        return {
            success: false,
            message: "Something went wrong. Please try again.",
        };
    }
}

// ========================================
// LOGIN ACTION
// ========================================

export async function loginAction(
    email: string,
    password: string
) {
    try {
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        const isPasswordValid = await verifyPassword(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        if (!user.emailVerifiedAt) {
            return {
                success: false,
                message: "Please verify your email before logging in.",
            };
        }

        await createSession(user.id);
        // 6. Return user information
        return {
            success: true,
            message: "Login successful.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    } catch (error) {
        console.error("Login error:", error);

        return {
            success: false,
            message: "Something went wrong. Please try again.",
        };
    }
}


// ========================================
// LOGOUT ACTION
// ========================================

export async function logoutAction() {
    try {
        // Delete database session
        // and remove session cookie
        await deleteCurrentSession();

        return {
            success: true,
            message: "Logged out successfully.",
        };
    } catch (error) {
        console.error("Logout error:", error);

        return {
            success: false,
            message: "Something went wrong.",
        };
    }
}
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
export async function forgotPasswordAction(
    email: string
) {
    try {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        // Don't reveal whether account exists
        if (!user) {
            return {
                success: true,
                message:
                    "If an account exists, a reset code has been sent.",
            };
        }

        // Remove old reset codes
        await prisma.verificationToken.deleteMany({
            where: {
                userId: user.id,
                type: "PASSWORD_RESET",
            },
        });

        // Generate OTP
        const otp = generateOtp();

        // Hash OTP
        const tokenHash = hashOtp(otp);

        // Save
        await prisma.verificationToken.create({
            data: {
                userId: user.id,
                type: "PASSWORD_RESET",
                tokenHash,
                expiresAt: new Date(
                    Date.now() + 10 * 60 * 1000
                ),
            },
        });

        // Send through Brevo
        await sendPasswordResetOtpEmail(
            user.email,
            user.name,
            otp
        );

        return {
            success: true,
            message:
                "If an account exists, a reset code has been sent.",
        };
    } catch (error) {
        console.error(
            "Forgot password error:",
            error
        );

        return {
            success: false,
            message: "Something went wrong.",
        };
    }
}
// ========================================
// RESET PASSWORD ACTION
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