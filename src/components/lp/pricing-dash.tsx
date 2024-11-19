"use client";

import Section from "../layout/section";
import { PricingCard } from "./pricing-card";

export function PricingDash() {
  return (
    <Section
      title="Pricing"
      subtitle="Pay once, use *forever*."
    >
      <div className="mt-4">
        <PricingCard />
      </div>
    </Section>
  );
}
