"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, User, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function PricingCard() {
  const [currentPrice, setCurrentPrice] = useState(9);
  const [nextPrice, setNextPrice] = useState(29);
  const [progressValue, setProgressValue] = useState(0);
  const [remainingPurchases, setRemainingPurchases] = useState(30);
  const [priceId, setPriceId] = useState(process.env.NEXT_PUBLIC_PRICE_ID_10);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn("twitter");
    setIsLoading(false);
  };

  const handleGetAccess = async () => {
    setIsLoading(true);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ priceId, user: session?.user }),
    });

    if (response.ok) {
      const data = await response.json();
      router.push(data.url);
    }
    setIsLoading(false);
  };

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
          setCurrentPrice(29);
          setNextPrice(49);
          setProgressValue(subCount * 10);
          setRemainingPurchases(10 - subCount);
          setPriceId(process.env.NEXT_PUBLIC_PRICE_ID_30);
        } else {
          setCurrentPrice(49);
          setNextPrice(0);
          setProgressValue(0);
          setRemainingPurchases(0);
          setPriceId(process.env.NEXT_PUBLIC_PRICE_ID_50);
        }
        setIsDataLoaded(true);
      });
  }, []);

  const pricingData = useMemo(
    () => ({
      title: "Lifetime Plan",
      subtitle: "Access all current and future features",
      price: currentPrice,
      nextPrice: nextPrice,
      progressValue: progressValue,
      remainingPurchases: remainingPurchases,
      features: [
        "Access to your analytics dashboard",
        "Discover and analyze viral tweets",
        "Immediate access to new features",
      ],
    }),
    [currentPrice, nextPrice, progressValue, remainingPurchases]
  );

  if (!isDataLoaded) {
    return (
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto bg-white border-2 border-primary">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-3xl font-bold text-center">{pricingData.title}</CardTitle>
        <p className="text-sm text-muted-foreground text-center">{pricingData.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-baseline justify-center space-x-2">
          <span className="text-5xl font-extrabold">${pricingData.price}</span>
          <span className="text-muted-foreground"> once</span>
        </div>
        <div className="space-y-2">
          <Progress value={pricingData.progressValue} className="h-3 w-full" />
          <div className="flex justify-center text-xs text-muted-foreground">
            <span>
              Price increases to ${pricingData.nextPrice} after {pricingData.remainingPurchases} more purchases
            </span>
          </div>
        </div>
        <ul className="space-y-3 text-sm">
          {pricingData.features.map((feature, index) => (
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
            onClick={handleGetAccess}
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
  );
} 