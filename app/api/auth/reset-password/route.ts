import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: "Token and password are required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                reset_token: token,
                reset_token_expires: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid or expired reset token" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                reset_token: null,
                reset_token_expires: null,
            },
        });

        return NextResponse.json(
            { message: "Password reset successful" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
