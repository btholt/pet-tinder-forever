import { Link, useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

/**
 * Compact header for signed-in routes: logo left, primary nav center-left,
 * sign-out right. Stays out of the way of the deck below it.
 */
export function AppHeader() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
      <Link to="/swipe" aria-label="Pawmarks home">
        <Logo />
      </Link>

      <nav className="flex items-center gap-1 text-sm font-medium">
        <Button asChild variant="ghost" size="sm">
          <Link to="/swipe">Swipe</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/matches">Matches</Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </nav>
    </header>
  );
}
