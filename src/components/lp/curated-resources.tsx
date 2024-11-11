import { ExternalLink, LayoutDashboard, Trophy, Map, BookOpen, Library } from "lucide-react";

import { BentoGrid, BentoCard } from "@/components/magicui/bento-grid";

export function CuratedResources() {
  const resources = [
    {
      title: "Twitter Resonator",
      description: "A tool to help you find and replicate the content that is working on Twitter.",
      link: "/dashboard",
      newTab: false,
      Icon: LayoutDashboard,
      className: "md:col-span-2",
      cta: "View Dashboard",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10" />
      ),
    },
    {
      title: "Shipper Leaderboard",
      description: "A leaderboard of the top shippers on Twitter.",
      link: "/leaderboard",
      newTab: false,
      Icon: Trophy,
      className: "md:col-span-1",
      cta: "Join Leaderboard",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10" />
      ),
    },
    {
      title: "Epidemic Blog",
      description: "A collection of articles and guides to help you on your builder journey.",
      link: "/blog",
      newTab: false,
      Icon: BookOpen,
      className: "md:col-span-1",
      cta: "Read Blog",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10" />
      ),
    },
    {
      title: "Community Map",
      description: "A map of builder communities around the world.",
      link: "/map",
      newTab: false,
      Icon: Map,
      className: "md:col-span-2",
      cta: "Explore Map",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10" />
      ),
    },
    // {
    //   title: "Recommended Reading",
    //   description:
    //     "A list of books related to marketing, product design, and general builder mindset.",
    //   link: "https://crystalline-athlete-cc7.notion.site/recommended-reading-11dedcf0f3ba80428dcec83619e3279b?pvs=4",
    //   newTab: true,
    //   Icon: Library,
    //   className: "md:col-span-3",
    //   background: (
    //     <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-900/10" />
    //   ),
    // },
  ];

  return (
    <section className="py-12 container">
      <span className="block font-bold uppercase text-primary text-center mb-8">
        Curated Resources
      </span>
      <BentoGrid className="max-w-6xl mx-auto">
        {resources.map((resource) => (
          <BentoCard
            key={resource.title}
            name={resource.title}
            description={resource.description}
            Icon={resource.Icon}
            className={resource.className}
            background={resource.background}
            href={resource.link}
            cta={resource.cta}
          />
        ))}
      </BentoGrid>
    </section>
  );
}
