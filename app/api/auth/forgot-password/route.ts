import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // We return 200 even if user doesn't exist for security (avoid email enumeration)
            return NextResponse.json(
                { message: "If an account exists with this email, a reset link has been sent." },
                { status: 200 }
            );
        }

        const resetToken = crypto.randomUUID();
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { email },
            data: {
                reset_token: resetToken,
                reset_token_expires: resetTokenExpires,
            },
        });

        const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

        await sendEmail({
            to: email,
            subject: "Password Reset Request - ServeFlow",
            text: `You requested a password reset. Click the following link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You requested a password reset for your ServeFlow account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Reset Password</a>
                    <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                </div>
            `,
        });

        return NextResponse.json(
            { message: "If an account exists with this email, a reset link has been sent." },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
