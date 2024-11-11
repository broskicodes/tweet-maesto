"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import SocialProofUsers from "./social-proof-users";
import posthog from "posthog-js";

export default function Hero() {
  const { status } = useSession();

  const handleJoinEpidemic = () => {
    posthog.capture("cta-clicked");
    signIn("twitter");
  };

  return (
    <section className="container flex flex-col items-center gap-8 pt-20 sm:gap-10 h-full justify-center flex-1 min-h-96">
      <h1 className="max-w-2xl text-center font-heading text-4xl font-semibold sm:text-5xl tracking-tight">
        The world needs more builders
      </h1>
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" asChild variant="outline" className="cursor-pointer border-border">
          <Link href="/blog/why-build">Learn More</Link>
        </Button>
        <Button
          onClick={handleJoinEpidemic}
          size="lg"
          className="cursor-pointer"
          disabled={status === "authenticated"}
        >
          {status === "authenticated" ? "Already Joined" : "Join the Epidemic"}
        </Button>
      </div>
    </section>
  );
}
