import { sendPasswordResetOtpEmail } from "@/lib/email";
import { generateOtp, hashOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

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