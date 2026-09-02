// lib/auth/session.ts

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Hash session token before storing it in database
function hashSessionToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}


// ========================================
// CREATE SESSION
// ========================================

export async function createSession(userId: string) {
    // Generate secure random session token
    const token = randomBytes(32).toString("hex");

    // Only store hash in database
    const tokenHash = hashSessionToken(token);

    // Session expires after 30 days
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    await prisma.session.create({//create DB session
        data: {
            tokenHash,
            userId,
            expiresAt,
        },
    });

    // Store raw token only in HTTP-only cookie
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, token, { //create browser cookies
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
    });

    return {
        success: true,
    };
}


// ========================================
// GET CURRENT SESSION
// ========================================

export async function getCurrentSession() {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    const tokenHash = hashSessionToken(token);

    const session = await prisma.session.findUnique({
        where: {
            tokenHash,
        },
        include: {
            user: true,
        },
    });

    // Session doesn't exist
    if (!session) {
        return null;
    }

    // Session expired
    if (session.expiresAt <= new Date()) {
        await prisma.session.delete({
            where: {
                id: session.id,
            },
        });

        cookieStore.delete(SESSION_COOKIE_NAME);

        return null;
    }

    return session;
}


// ========================================
// GET CURRENT USER
// ========================================

export async function getCurrentUser() {
    const session = await getCurrentSession();

    if (!session) {
        return null;
    }

    return session.user;
}


// ========================================
// DELETE CURRENT SESSION
// ========================================

export async function deleteCurrentSession() {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return;
    }

    const tokenHash = hashSessionToken(token);

    await prisma.session.deleteMany({
        where: {
            tokenHash,
        },
    });

    // Remove cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
}