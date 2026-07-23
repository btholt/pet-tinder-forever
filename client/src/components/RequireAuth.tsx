import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSession } from "@/lib/auth-client";

/**
 * Guards signed-in-only routes (/swipe, /matches). Renders nothing while the
 * session is resolving so we never flash the landing page at a signed-in
 * user, and redirects signed-out visitors to "/".
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) return null;
  if (!session) return <Navigate to="/" replace />;

  return <>{children}</>;
}

/**
 * The inverse guard for "/", "/signin", "/signup": once a session exists,
 * send the visitor straight to the swipe deck instead of the marketing/auth
 * pages.
 */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) return null;
  if (session) return <Navigate to="/swipe" replace />;

  return <>{children}</>;
}
