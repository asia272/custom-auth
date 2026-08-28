// actions/auth.actions.ts

"use server";


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
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Check whether user already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        // 2. If user exists, stop registration
        if (existingUser) {
            return {
                success: false,
                message: "User already exists with this email. Try another email.",
            };
        }

        // 3. Hash password
        const passwordHash = await hashPassword(password);

        // 4. Create user
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
            },
        });

        return {
            success: true,
            message: "Account created successfully.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
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

        // 1. Find user by email
        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        // 2. User doesn't exist
        if (!user) {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        // 3. Verify password
        const isPasswordValid = await verifyPassword(
            password,// user given password
            user.passwordHash//user store password
        );

        // 4. Wrong password
        if (!isPasswordValid) {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        // 5. Create database session
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