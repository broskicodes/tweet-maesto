"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import posthog from "posthog-js";
import { SHOW_MAP_EVENT } from "@/lib/types";

export function Hero() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("subscribedEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      setSuccess(true);
      window.dispatchEvent(new Event(SHOW_MAP_EVENT));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
        posthog.capture("newsletter-sub", { email });
        localStorage.setItem("subscribedEmail", email);
        window.dispatchEvent(new Event(SHOW_MAP_EVENT));
      } else {
        throw new Error("Failed to subscribe");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="container flex flex-col items-center gap-8 pb-28 pt-20 sm:gap-10">
      <h1 className="max-w-2xl text-center font-heading text-4xl font-semibold sm:text-5xl tracking-tight">
        Find inspiring builder communities near you
      </h1>
      <p className="max-w-lg text-center text-lg text-muted-foreground sm:text-xl">
        Use this interactive map to discover builder events and communities near you
      </p>
      {!success ? (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 border-border bg-card px-6 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-14 sm:flex-1"
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 cursor-pointer text-base sm:h-14"
            disabled={isLoading}
          >
            {isLoading ? "Checking..." : "Get Access"}
          </Button>
        </form>
      ) : (
        <p className="text-green-500">{"You're subscribed with: " + email}</p>
      )}
      {error && <p className="text-red-500">{error}</p>}
      <div className="relative sm:mt-8">
        <Image
          alt="Community Map"
          src="/images/map.png"
          width={800}
          height={548}
          priority
          className="rounded-xl border border-border shadow-lg"
        />
        <div className="absolute inset-0 -z-10 bg-primary/20 [filter:blur(180px)]" />
      </div>
    </section>
  );
}
