// actions/auth.actions.ts

"use server";

import {
    sendPasswordResetOtpEmail,
    sendVerificationOtpEmail,
} from "@/lib/email";
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

export async function signupAction(
    name: string,
    email: string,
    password: string
) {
    try {
        const normalizedEmail = email.trim().toLowerCase();

        // ========================================
        // 1. CHECK EXISTING USER
        // ========================================

        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        // ========================================
        // 2. EXISTING USER
        // ========================================

        if (existingUser) {

            // ----------------------------------------
            // User already verified
            // ----------------------------------------

            if (existingUser.emailVerifiedAt) {
                return {
                    success: false,
                    message:
                        "User already exists with this email. Please login.",
                };
            }

            // ----------------------------------------
            // User exists but email is NOT verified
            // ----------------------------------------

            // Delete old verification OTP
            await prisma.verificationToken.deleteMany({
                where: {
                    userId: existingUser.id,
                    type: "EMAIL_VERIFICATION",
                },
            });

            // Generate new OTP
            const otp = generateOtp();

            // Hash OTP before storing
            const tokenHash = hashOtp(otp);

            // Save new OTP
            await prisma.verificationToken.create({
                data: {
                    userId: existingUser.id,
                    type: "EMAIL_VERIFICATION",
                    tokenHash,
                    expiresAt: new Date(
                        Date.now() + 10 * 60 * 1000
                    ),
                },
            });

            // Send new OTP
            await sendVerificationOtpEmail(
                existingUser.email,
                existingUser.name,
                otp
            );

            return {
                success: true,
                message:
                    "Your email is not verified. A new verification code has been sent to your email.",
            };
        }

        // ========================================
        // 3. NEW USER
        // ========================================

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
            },
        });

        // ========================================
        // 4. GENERATE OTP
        // ========================================

        const otp = generateOtp();

        // Hash OTP
        const tokenHash = hashOtp(otp);

        // ========================================
        // 5. SAVE OTP
        // ========================================

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

        // ========================================
        // 6. SEND OTP THROUGH BREVO
        // ========================================

        await sendVerificationOtpEmail(
            user.email,
            user.name,
            otp
        );

        // ========================================
        // IMPORTANT:
        // NO SESSION DURING SIGNUP
        // ========================================

        return {
            success: true,
            message:
                "Verification code sent to your email.",
        };

    } catch (error) {
        console.error("Signup error:", error);

        return {
            success: false,
            message:
                "Something went wrong. Please try again.",
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
        // ========================================
        // 1. NORMALIZE EMAIL
        // ========================================

        const normalizedEmail = email.trim().toLowerCase();

        // ========================================
        // 2. FIND USER
        // ========================================

        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        // ========================================
        // 3. USER NOT FOUND
        // ========================================

        if (!user) {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        // ========================================
        // 4. VERIFY PASSWORD
        // ========================================

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

        // ========================================
        // 5. CHECK EMAIL VERIFICATION
        // ========================================

        if (!user.emailVerifiedAt) {
            return {
                success: false,
                message:
                    "Please verify your email before logging in.",
            };
        }

        // ========================================
        // 6. CREATE SESSION
        // ========================================

        await createSession(user.id);

        // ========================================
        // 7. RETURN USER
        // ========================================

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
            message:
                "Something went wrong. Please try again.",
        };
    }
}


// ========================================
// LOGOUT ACTION
// ========================================

export async function logoutAction() {
    try {
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