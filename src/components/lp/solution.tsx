"use client";

import FlickeringGrid from "@/components/magicui/flickering-grid";
import Ripple from "@/components/magicui/ripple";
import Safari from "@/components/magicui/safari";
import Section from "@/components/layout/section";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import DotPattern from "../magicui/dot-pattern";

const features = [
  {
    title: "Track Tweet Performance",
    description:
      "Get ideas for what will do well in the future by analyzing your most successful tweets.",
    className: "hover:bg-primary/10 transition-all duration-500 ease-out",
    content: (
      <div className="h-full w-full">
        {/* <DotPattern
          className="z-0 absolute -bottom-full [mask-image:radial-gradient(3px_circle_at_center,white,transparent)]"
          color="#000"
        /> */}
        <img
          src={`/images/performance.png`}
          alt="Performance"
          className="rounded-lg -mb-16 mt-4 max-h-64 w-full select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
        />
      </div>
    ),
  },
  {
    title: "Find Your Target Audience",
    description:
      "Create a custom audience profile and content strategy by talking to the AI Tweet Maestro.",
    className:
      "order-2 xl:order-none mx-auto hover:bg-primary/10 transition-all duration-500 ease-out",
    content: (
      <>
        <img
          src={`/images/maestro.png`}
          alt="Audience"
          className="rounded-lg -mb-16 mt-4 max-h-64 w-full select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
        />
      </>
    ),
  },
  {
    title: "Discover and Analyze Competitors",
    description:
      "Improve your content strategy by learning what's working for other creators.",
    className:
      "md:row-span-2 hover:bg-primary/10 transition-all duration-500 ease-out",
    content: (
      <>
        <FlickeringGrid
          className="z-0 absolute inset-0 [mask:radial-gradient(circle_at_center,#fff_400px,transparent_0)]"
          squareSize={4}
          gridGap={6}
          color="#000"
          maxOpacity={0.1}
          flickerChance={0.1}
          height={800}
          width={800}
        />
        <img
          src={`/images/similar.png`}
          alt="Competitors"
          className="rounded-xl -mb-48 ml-8 mt-16 w-[400px] max-w-none select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-x-[-10px] transition-all duration-300"
        />
      </>
    ),
  },
  {
    title: "Track Your Stats",
    description:
      "Stay consistent by tracking your growth and engagement over time.",
    className:
      "flex-row order-4 md:col-span-2 md:flex-row xl:order-none hover:bg-primary/10 transition-all duration-500 ease-out",
    content: (
      <>
        <Ripple className="absolute -bottom-full" />
        <Safari
          src={`/images/dash-stats.png`}
          url="https://acme.ai"
          className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
        />
      </>
    ),
  },
];

export default function Component() {
  return (
    <Section
      title="The Tool"
      subtitle="Track what's working with *powerful analytics*"
      description="Get ideas for what to post, when to post and how to post so that you can get the most engagement."
      className="bg-neutral-100 dark:bg-neutral-900"
    >
      <div className="mx-auto mt-16 grid max-w-sm grid-cols-1 gap-6 text-gray-500 md:max-w-3xl md:grid-cols-2 xl:grid-rows-2 md:grid-rows-3 xl:max-w-6xl xl:auto-rows-fr xl:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className={cn(
              "group relative items-start overflow-hidden bg-neutral-50 dark:bg-neutral-800 p-6 rounded-2xl",
              feature.className
            )}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: index * 0.1,
            }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="font-semibold mb-2 text-primary">
                {feature.title}
              </h3>
              <p className="text-foreground">{feature.description}</p>
            </div>
            {feature.content}
            <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-neutral-50 dark:from-neutral-900 pointer-events-none"></div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
