import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export default {
    providers: [
        Credentials({
            async authorize(credentials) {
                const { email, password } = credentials;

                if (!email || !password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: email as string },
                });

                if (!user || !user.password) return null;

                const passwordMatch = await bcrypt.compare(
                    password as string,
                    user.password
                );

                if (passwordMatch) return user;

                return null;
            },
        }),
    ],
    callbacks: {
        // Edge-safe JWT callback — no DB calls
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as Role;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
