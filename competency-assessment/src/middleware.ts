import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Manager/Admin-only routes
    if (
      (path.startsWith("/reviews") || path.startsWith("/calibration")) &&
      token?.role !== "MANAGER" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/assessment", req.url));
    }

    // Admin-only routes
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/assessment", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/assessment/:path*",
    "/my-growth-plan/:path*",
    "/reviews/:path*",
    "/calibration/:path*",
    "/admin/:path*",
  ],
};
