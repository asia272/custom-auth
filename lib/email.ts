import brevo from "@/lib/brevo";

export async function sendVerificationOtpEmail(
    email: string,
    name: string,
    otp: string
) {
    await brevo.transactionalEmails.sendTransacEmail({
        sender: {
            name: process.env.BREVO_SENDER_NAME!,
            email: process.env.BREVO_SENDER_EMAIL!,
        },

        to: [
            {
                email,
                name,
            },
        ],

        subject: "Verify your email",

        textContent: `
Hello ${name},

Your email verification code is:

${otp}

This code will expire in 10 minutes.

If you did not create this account, you can ignore this email.
        `.trim(),

        htmlContent: `
            <div style="font-family: Arial, sans-serif;">
                <h2>Verify your email</h2>

                <p>Hello ${name},</p>

                <p>Your verification code is:</p>

                <h1>${otp}</h1>

                <p>
                    This code will expire in
                    <strong>10 minutes</strong>.
                </p>

                <p>
                    If you did not create this account,
                    you can ignore this email.
                </p>
            </div>
        `.trim(),
    });
}
export async function sendPasswordResetOtpEmail(
    email: string,
    name: string,
    otp: string
) {
    await brevo.transactionalEmails.sendTransacEmail({
        sender: {
            name: process.env.BREVO_SENDER_NAME!,
            email: process.env.BREVO_SENDER_EMAIL!,
        },

        to: [
            {
                email,
                name,
            },
        ],

        subject: "Reset your password",

        textContent: `
Hello ${name},

Your password reset code is:

${otp}

This code will expire in 10 minutes.

If you did not request a password reset, you can ignore this email.
        `.trim(),

        htmlContent: `
            <div style="font-family: Arial, sans-serif;">
                <h2>Reset your password</h2>

                <p>Hello ${name},</p>

                <p>Your password reset code is:</p>

                <h1>${otp}</h1>

                <p>
                    This code will expire in
                    <strong>10 minutes</strong>.
                </p>

                <p>
                    If you did not request a password reset,
                    you can ignore this email.
                </p>
            </div>
        `.trim(),
    });
}