import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
    const isLiveDisplayRoute = nextUrl.pathname.startsWith("/live/");
    const isLiveStateApi = nextUrl.pathname.match(/^\/api\/services\/[^/]+\/live\/state$/);
    const isPublicRoute = ["/", "/login", "/signup", "/forgot-password", "/reset-password"].includes(nextUrl.pathname) || isLiveDisplayRoute || isLiveStateApi;
    const isAuthRoute = ["/login", "/signup", "/forgot-password", "/reset-password"].includes(nextUrl.pathname);

    if (isApiAuthRoute) {
        return null;
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/", nextUrl));
        }
        return null;
    }

    if (!isLoggedIn && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    return null;
});

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
