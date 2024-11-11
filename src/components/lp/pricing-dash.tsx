"use client";

import { PricingCard } from "./pricing-card";

export function PricingDash() {
  return (
    <section id="pricing" className="p-12 bg-gray-50 flex flex-col items-center justify-center">
      <div className="flex flex-col gap-3 items-center mb-12">
        <div className="flex flex-col gap-3">
          <span className="font-bold uppercase text-primary text-center">Pricing</span>
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl text-balance text-center">
            Simple pricing
          </h2>
        </div>
        <p className="text-lg text-muted-foreground text-balance max-w-lg text-center">
          Pay once, use forever.
        </p>
      </div>
      <PricingCard />
    </section>
  );
}
