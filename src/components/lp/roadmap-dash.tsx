interface Task {
  text: string;
  dateRange: string;
}

const completedTasks: Task[] = [
  {
    text: "Purchased Builder Epidemic domain.",
    dateRange: "2024-10-11",
  },
  {
    text: "Created a simple landing page.",
    dateRange: "2024-10-12",
  },
  {
    text: `Launched [the blog](${process.env.NEXT_PUBLIC_ENV_URL}/blog) with first 2 articles`,
    dateRange: "2024-10-13",
  },
  {
    text: `More [blog posts](${process.env.NEXT_PUBLIC_ENV_URL}/blog).`,
    dateRange: "2024-10-14 - 2024-10-17",
  },
  {
    text: `Launched [the map](${process.env.NEXT_PUBLIC_ENV_URL}/map) and added first communities`,
    dateRange: "2024-10-18",
  },
  {
    text: "Lots of [tweets](https://x.com/braedenhall_).",
    dateRange: "2024-10-18 - 2024-10-23",
  },
  {
    text: `Launched [the leaderboard](${process.env.NEXT_PUBLIC_ENV_URL}/leaderboard).`,
    dateRange: "2024-10-25",
  },
  {
    text: "First 50 builders on the leaderboard.",
    dateRange: "2024-10-26",
  },
  {
    text: "Added daily cron job to update leaderboard.",
    dateRange: "2024-10-28",
  },
  {
    text: `Launched Twitter [analytics dashboard](${process.env.NEXT_PUBLIC_ENV_URL}/dashboard).`,
    dateRange: "2024-10-30",
  },
  {
    text: "Add ability to view analytics data for other users.",
    dateRange: "2024-10-31",
  },
  {
    text: `Add advanced Twitter search with filters to the dashboard.`,
    dateRange: "2024-11-01",
  },
  {
    text: `Add [dashboard](${process.env.NEXT_PUBLIC_ENV_URL}/dashboard) for analyzing the latest viral tweets.`,
    dateRange: "2024-11-03",
  },
];

const comingSoon: Omit<Task, "dateRange">[] = [
  {
    text: "Create a neural network to predict tweet performance.",
  },
  {
    text: "Add audience profiles for users.",
  },
  {
    text: "Daily, weekly, and monthly twitter trend analysis.",
  },
];

// Helper function to get the end date from a date range
function getEndDate(dateRange: string): Date {
  const dates = dateRange.split(" - ");
  // Parse the date string and handle timezone consistently
  const date = new Date(dates[dates.length - 1] + "T00:00:00.000Z");
  // Adjust for local timezone
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return localDate;
}

// Helper function to get week range label
function getWeekLabel(date: Date): string {
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay()); // Get Sunday
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6); // Get Saturday

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };

  return `${formatDate(sunday)} - ${formatDate(saturday)}`;
}

// Helper function to normalize date to start of day and ISO string
function getWeekKey(date: Date): string {
  const sunday = new Date(date);
  // Ensure we're working with a clone of the date
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(date.getDate() - date.getDay());
  return `week-${sunday.toISOString().split("T")[0]}`; // Only use the date part
}

// Organize tasks by weeks
const weeks = completedTasks.reduce(
  (acc: Record<string, { label: string; tasks: Task[] }>, task) => {
    const endDate = getEndDate(task.dateRange);
    const weekKey = getWeekKey(endDate);

    if (!acc[weekKey]) {
      acc[weekKey] = {
        label: getWeekLabel(endDate),
        tasks: [],
      };
    }

    acc[weekKey].tasks.push(task);
    return acc;
  },
  {},
);

import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function RoadmapDash() {
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Scroll to the end on mount
  useEffect(() => {
    if (scrollViewportRef.current) {
      const scrollElement = scrollViewportRef.current;
      scrollElement.scrollLeft = scrollElement.scrollWidth;
    }
  }, []);

  // Get current week's key
  const currentWeekKey = getWeekKey(new Date());

  return (
    <section
      id="roadmap"
      className="p-12 flex flex-col items-center justify-center w-full max-w-6xl mx-auto"
    >
      <div className="flex flex-col gap-3 items-center mb-8">
        <div className="flex flex-col gap-3">
          <span className="font-bold uppercase text-primary text-center">Roadmap</span>
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl text-balance text-center">
            I ship <span className="italic">kinda fast</span>
          </h2>
        </div>
        <p className="text-lg text-muted-foreground text-balance max-w-lg text-center">
          See current and upcoming features.
        </p>
      </div>
      <ScrollArea className="w-full rounded-md">
        <div ref={scrollViewportRef} className="flex gap-4 p-4 w-full overflow-x-auto">
          {Object.entries(weeks).map(([weekKey, week]) => (
            <div
              key={weekKey}
              className="shrink-0 w-[300px] sm:w-[320px] py-4 px-4 rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <h3 className="font-semibold mb-4">
                {weekKey === currentWeekKey ? "This Week" : week.label}
              </h3>
              <ScrollArea className="h-[360px]">
                <div className="space-y-3">
                  {week.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="text-sm p-3 rounded-md border  hover:bg-muted transition-colors"
                    >
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              className="text-primary hover:underline"
                              rel="noopener noreferrer"
                            />
                          ),
                        }}
                      >
                        {task.text}
                      </ReactMarkdown>
                      <div className="text-xs text-muted-foreground mt-2">{task.dateRange}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}
          <div className="shrink-0 w-[300px] sm:w-[320px] py-4 px-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="font-semibold mb-4">Coming Soon</h3>
            <ScrollArea className="h-[360px]">
              <div className="space-y-3">
                {comingSoon.map((task, index) => (
                  <div
                    key={index}
                    className="text-sm p-3 rounded-md border  hover:bg-muted transition-colors"
                  >
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="text-primary hover:underline"
                            rel="noopener noreferrer"
                          />
                        ),
                      }}
                    >
                      {task.text}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </ScrollArea>
    </section>
  );
}
