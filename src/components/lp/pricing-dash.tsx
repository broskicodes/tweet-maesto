"use client";

import Section from "../layout/section";
import { PricingCard } from "./pricing-card";

export function PricingDash() {
  return (
    <Section title="Pricing" subtitle="*Flexible* pricing.">
      <div className="mt-4">
        <PricingCard />
      </div>
    </Section>
  );
}
