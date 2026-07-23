import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

/**
 * Shared shell for /signin and /signup: full-bleed pet photo on the left
 * half at md: and up, form on the right. Single column on mobile, photo
 * omitted so the form is immediately usable.
 */
export function AuthLayout({
  photoUrl,
  title,
  subtitle,
  children,
}: {
  photoUrl: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-paper">
      <div className="relative hidden w-1/2 md:block">
        <img
          src={photoUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgb(255 61 104 / 0.55), rgb(33 18 58 / 0.65))",
          }}
        />
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 md:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-8" />
          <h1 className="font-display text-3xl font-semibold text-ink">
            {title}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
