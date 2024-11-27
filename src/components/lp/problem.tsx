import BlurFade from "@/components/magicui/blur-fade";
import Section from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { NotebookPen, Search, Users } from "lucide-react";

const steps = [
  {
    number: "Step 1",
    title: "Choose Your Target Audience",
    description:
      "First choose who you want in your audience. What is your niche? Who are you trying to sell to? Who does your product/service help?",
    icon: Users,
  },
  {
    number: "Step 2",
    title: "Learn What They Like",
    description:
      "Figure out what content your audience already likes to consume. What other creators do they follow? What style of content do they make?",
    icon: Search,
  },
  {
    number: "Step 3",
    title: "Make It Consistently",
    description:
      "Start making engaging content catered to your audience. Do it consistently and the algorithm will do the rest.",
    icon: NotebookPen,
  },
];

export default function Component() {
  return (
    <Section title="The Question" subtitle="How do you grow *consistently* on Twitter?">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {steps.map((step, index) => (
          <BlurFade key={index} delay={0.2 + index * 0.2} inView>
            <Card className="bg-background border-none shadow-none">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-2xl font-light text-primary/50">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          </BlurFade>
        ))}
      </div>
    </Section>
  );
}
