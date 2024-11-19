"use client";

import Footer from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import HeroDash from "@/components/lp/hero-dash";
import { PricingDash } from "@/components/lp/pricing-dash";
import Problem from "@/components/lp/problem";
import RoadmapDash from "@/components/lp/roadmap-dash";
import Solution from "@/components/lp/solution";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background relative">
      <main className="flex-1 flex flex-col h-screen w-full bg-background">
        <Header />
        <HeroDash />
        <Problem />
        <Solution />
        <RoadmapDash />
        <PricingDash />
      </main>
      <Footer />
    </div>
  );
}
