import { Link } from "react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

/**
 * The landing page: full-bleed hero photo, brand-gradient scrim, logo, one
 * headline, one supporting line, a single primary CTA. Nothing else — no
 * feature grid, no testimonials, no footer.
 */
export function Landing() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink">
      <img
        src="https://pets-images.dev-apis.com/pets/dog12.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgb(255 61 104 / 0.75), rgb(255 158 68 / 0.55) 45%, rgb(33 18 58 / 0.85) 100%)",
        }}
      />

      <div className="relative z-10 p-6 sm:p-8">
        <Logo variant="light" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-start justify-end gap-6 p-6 pb-16 sm:p-12 sm:pb-20">
        <h1 className="max-w-md font-display text-4xl font-semibold text-paper drop-shadow-sm sm:text-5xl">
          Find your next best friend
        </h1>
        <p className="max-w-sm text-base font-medium text-paper/90">
          Swipe through adoptable pets near you and match with the one who's
          waiting for you.
        </p>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-berry to-mango text-paper shadow-lg hover:opacity-90"
          >
            <Link to="/signup">Get started</Link>
          </Button>
          <Link
            to="/signin"
            className="text-sm font-medium text-paper underline underline-offset-4"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
