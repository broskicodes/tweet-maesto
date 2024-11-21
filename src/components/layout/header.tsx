"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { MobileNavbar } from "@/components/layout/mobile-navbar";
import posthog from "posthog-js";
import { Logo } from "./logo";
import { SIGNUP_EVENT } from "@/lib/types";

const links = [
  {
    title: "Dashboard",
    link: "/dashboard",
  },
  {
    title: "Idea Generator",
    link: "/ideas",
  },
  {
    title: "Pricing",
    link: "/#pricing",
  },
  // {
  //   title: "Blog",
  //   link: "/blog",
  // },
];

export function Header() {
  const { status } = useSession();

  const handleSignIn = () => {
    posthog.capture("sign-in-clicked");
    signIn("twitter");
  };

  const handleSignOut = () => {
    posthog.capture("sign-out-clicked");
    signOut();
  };

  return (
    <header className="container flex items-center justify-between gap-4 sm:gap-10 py-4">
      <Link href="/" className="flex items-center gap-1">
        <Logo scale={0.7} />
        <span className="font-heading text-xl font-bold mt-1">Tweet Maestro</span>
      </Link>
      <div className="flex items-center gap-10">
        <nav className="hidden items-center gap-10 md:flex justify-end">
          {links.map((link) => (
            <Link
              key={link.title}
              href={link.link}
              className="flex cursor-pointer items-center text-lg font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
            >
              {link.title}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {status === "authenticated" ? (
            <Button onClick={handleSignOut}>Sign Out</Button>
          ) : (
            <Button onClick={handleSignIn}>Sign Up</Button>
          )}
        </div>
      </div>
      <MobileNavbar>
        <div className="rounded-b-lg bg-background py-4 container text-foreground shadow-xl">
          <nav className="flex flex-col gap-1 pt-2">
            {links.map((link) => (
              <Link
                key={link.title}
                href={link.link}
                className="flex w-full cursor-pointer items-center rounded-md p-2 font-medium text-muted-foreground hover:text-foreground"
              >
                {link.title}
              </Link>
            ))}

            {status === "authenticated" ? (
              <Button onClick={handleSignOut} size="lg" className="mt-2 w-full">
                Sign Out
              </Button>
            ) : (
              <Button onClick={handleSignIn} size="lg" className="mt-2 w-full">
                Sign Up
              </Button>
            )}
          </nav>
        </div>
      </MobileNavbar>
    </header>
  );
}
