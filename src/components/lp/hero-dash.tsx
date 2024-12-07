import { Button } from "@/components/ui/button";
import Image from "next/image";
import SocialProofUsers from "./social-proof-users";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import posthog from "posthog-js";

export default function HeroDash() {
  const { data: session } = useSession();

  return (
    <section className="container flex flex-col items-center gap-8 pb-28 pt-20 sm:gap-10">
      <SocialProofUsers />
      <h1 className="max-w-2xl text-center font-heading text-4xl font-semibold sm:text-5xl tracking-tight">
        Write better tweets, faster.
      </h1>
      <p className="max-w-lg text-center text-lg text-muted-foreground sm:text-xl">
        Generate viral ideas, compose perfectly structured tweets and watch your engagement grow.
      </p>
      <div>
        <Button asChild size="lg" className="cursor-pointer text-lg px-12 py-6">
          {session ? (
            <Link href="/compose">Start Tweeting</Link>
          ) : (
            <Button
              onClick={() => {
                posthog.capture("sign-in-clicked");
                signIn("twitter");
              }}
            >
              Sign Up for Free
            </Button>
          )}
        </Button>
      </div>
      <div className="relative sm:mt-8">
        <Image
          src="/images/composer.png"
          alt="SaaS Dashboard"
          width={1000}
          height={698}
          priority
          className="rounded-xl border border-border shadow-lg"
        />
        <div className="absolute inset-0 -z-10 bg-primary/20 [filter:blur(180px)]" />
      </div>
    </section>
  );
}
