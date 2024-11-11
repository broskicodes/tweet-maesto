import { Button } from "@/components/ui/button";
import Image from "next/image";
import SocialProofUsers from "./social-proof-users";
import Link from "next/link";

export default function HeroDash() {
  return (
    <section className="container flex flex-col items-center gap-8 pb-28 pt-20 sm:gap-10">
      <SocialProofUsers />
      <h1 className="max-w-2xl text-center font-heading text-4xl font-semibold sm:text-5xl tracking-tight">
        Grow your Twitter audience
      </h1>
      <p className="max-w-lg text-center text-lg text-muted-foreground sm:text-xl">
        A set of tools to help you find and replicate the content that is working on Twitter.
      </p>
      <div>
        <Button asChild size="lg" className="cursor-pointer text-lg px-12 py-6">
          <Link href="#pricing">Get Started</Link>
        </Button>
      </div>
      <div className="relative sm:mt-8">
        <Image
          src="/images/dashboard.png"
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
