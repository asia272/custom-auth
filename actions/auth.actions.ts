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


