"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PricingCard } from "@/components/lp/pricing-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[840px] p-6">
        <DialogHeader>
          <DialogTitle>Upgrade to access premium features</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[90vh] p-6">
          <PricingCard className="pt-4" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
