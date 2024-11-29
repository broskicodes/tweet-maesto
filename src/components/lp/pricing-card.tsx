"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, User, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

interface PricingPlan {
  type: 'lifetime' | 'monthly';
  title: string;
  subtitle: string;
  price: number;
  nextPrice?: number;
  progressValue?: number;
  remainingPurchases?: number;
  priceId: string;
  features: string[];
  recommended?: boolean;
}

export function PricingCard({ className }: { className?: string }) {
  const [lifetimePrice, setLifetimePrice] = useState(29);
  const [nextLifetimePrice, setNextLifetimePrice] = useState(49);
  const [monthlyPrice, setMonthlyPrice] = useState(9);
  const [nextMonthlyPrice, setNextMonthlyPrice] = useState(19);
  const [progressValue, setProgressValue] = useState(0);
  const [remainingPurchases, setRemainingPurchases] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [lifetimePriceId, setLifetimePriceId] = useState(process.env.NEXT_PUBLIC_PRICE_ID_10);
  const [monthlyPriceId, setMonthlyPriceId] = useState(process.env.NEXT_PUBLIC_MPID_10);
  const { data: session } = useSession();
  const router = useRouter();

  const plans: PricingPlan[] = useMemo(
    () => [
      {
        type: 'monthly',
        title: "Monthly",
        subtitle: "Flexible monthly subscription",
        price: monthlyPrice,
        nextPrice: nextMonthlyPrice,
        progressValue,
        remainingPurchases,
        priceId: monthlyPriceId!,
        features: [
          "Access to your analytics dashboard",
          "Discover and analyze viral tweets",
          "Cancel anytime",
        ],
      },
      {
        type: 'lifetime',
        title: "Lifetime",
        subtitle: "Access all current and future features",
        recommended: true,
        price: lifetimePrice,
        nextPrice: nextLifetimePrice,
        progressValue,
        remainingPurchases,
        priceId: lifetimePriceId!,
        features: [
          "Access to your analytics dashboard",
          "Discover and analyze viral tweets",
          "Immediate access to new features",
          "One-time payment",
        ],
      },
    ],
    [lifetimePrice, nextLifetimePrice, monthlyPrice, nextMonthlyPrice, progressValue, remainingPurchases, lifetimePriceId, monthlyPriceId]
  );

  useEffect(() => {
    fetch("/api/subscribers", {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const subCount = data.length;
        if (subCount < 10) {
          setLifetimePrice(29);
          setNextLifetimePrice(49);
          setMonthlyPrice(9);
          setNextMonthlyPrice(19);
          setProgressValue(subCount * 10);
          setRemainingPurchases(10 - subCount);
          setLifetimePriceId(process.env.NEXT_PUBLIC_PRICE_ID_30);
          setMonthlyPriceId(process.env.NEXT_PUBLIC_MPID_10);
        } else if (subCount < 20) {
          setLifetimePrice(49);
          setNextLifetimePrice(99);
          setMonthlyPrice(9);
          setNextMonthlyPrice(19);
          setProgressValue(subCount * 5);
          setRemainingPurchases(20 - subCount);
          setLifetimePriceId(process.env.NEXT_PUBLIC_PRICE_ID_50);
          setMonthlyPriceId(process.env.NEXT_PUBLIC_MPID_10);
        } else {
          setLifetimePrice(99);
          setNextLifetimePrice(149);
          setMonthlyPrice(19);
          setNextMonthlyPrice(29);
          setProgressValue(0);
          setRemainingPurchases(0);
          setLifetimePriceId(process.env.NEXT_PUBLIC_PRICE_ID_100);
          setMonthlyPriceId(process.env.NEXT_PUBLIC_MPID_20);
        }
        setIsDataLoaded(true);
      });
  }, []);

  const handleSignIn = async () => {
    posthog.capture("sign-in-clicked");
    setIsLoading(true);
    await signIn("twitter");
    setIsLoading(false);
  };

  const handleGetAccess = async (priceId: string, planType: string) => {
    posthog.capture("checkout-started");
    setIsLoading(true);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ priceId, user: session?.user, plan: planType }),
    });

    if (response.ok) {
      const data = await response.json();
      router.push(data.url);
    }
    setIsLoading(false);
  };

  if (!isDataLoaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {[0, 1].map((i) => (
          <div key={i} className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto ${className}`}>
      {plans.map((plan) => (
        <Card 
          key={plan.type} 
          className={`w-full bg-white border-2 ${
            plan.recommended 
              ? "border-primary relative" 
              : "border-muted"
          }`}
        >
          {plan.recommended && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0 bg-primary rounded-full">
              <span className="text-xs font-semibold text-white">MOST POPULAR</span>
            </div>
          )}
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl font-bold text-center mt-2">{plan.title}</CardTitle>
            <p className="text-sm text-muted-foreground text-center">{plan.subtitle}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-baseline justify-center space-x-2">
              <span className="text-5xl font-extrabold">${plan.price}</span>
              <span className="text-muted-foreground">
                {plan.type === 'monthly' ? '/month' : ' once'}
              </span>
            </div>
            {plan.progressValue !== undefined && (
              <div className="space-y-2">
                <Progress value={plan.progressValue} className="h-3 w-full" />
                <div className="flex justify-center text-xs text-muted-foreground">
                  <span>
                    Price increases to ${plan.nextPrice} after {plan.remainingPurchases} more purchases
                  </span>
                </div>
              </div>
            )}
            <ul className="space-y-3 text-sm h-28">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            {!session && (
              <Button className="w-full text-lg font-semibold" size="lg" onClick={handleSignIn}>
                <User className="mr-2 h-5 w-5" /> Sign in with Twitter
              </Button>
            )}
            {session && !session.user?.subscribed && (
              <Button
                disabled={isLoading}
                className="w-full text-lg font-semibold"
                size="lg"
                onClick={() => handleGetAccess(plan.priceId, plan.type)}
              >
                <Zap className="mr-2 h-5 w-5" />
                <span>{isLoading ? "Loading..." : "Get Access"}</span>
              </Button>
            )}
            {session && session.user?.subscribed && (
              <Button
                disabled={isLoading}
                className="w-full text-lg font-semibold"
                size="lg"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Button>
            )}
            <Badge variant="secondary" className="w-full justify-center py-1">
              3-day money-back guarantee
            </Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
