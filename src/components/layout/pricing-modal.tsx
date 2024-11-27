"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PricingCard } from "@/components/lp/pricing-card";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle>Upgrade to access this feature</DialogTitle>
        </DialogHeader>
        <PricingCard />
      </DialogContent>
    </Dialog>
  );
}
