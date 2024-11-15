import { useState, useCallback } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { format } from "date-fns";
import { Metric, metricLabels } from "@/lib/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartData, metricIcons } from "./shared";

interface PerformanceChartProps {
  chartData: ChartData[];
  onMetricChange?: (metric: Metric) => void;
}

const calculateMaxValues = (chartData: any[]) => ({
  impressions: Math.max(...chartData.map((t) => t.impressions)) * 0.5,
  likes: Math.max(...chartData.map((t) => t.likes)) * 0.5,
  comments: Math.max(...chartData.map((t) => t.comments)) * 0.5,
  bookmarks: Math.max(...chartData.map((t) => t.bookmarks)) * 0.5,
  retweets: Math.max(...chartData.map((t) => t.retweets)) * 0.5,
  engagement_rate: Math.max(...chartData.map((t) => t.engagement_rate)) * 0.5
});

const CustomTooltip = ({ active, payload, label, selectedMetric, maxValues }: any) => {
  if (!active || !payload || !payload.length) return null;

  const tweet = payload[0].payload;

  // Normalize values to a 0-100 scale
  const normalizeValue = (value: number, metric: string) => {
    const max = maxValues[metric as keyof typeof maxValues];
    return max > 0 ? (value / max) * 100 : 0;
  };

  const radarData = [
    { metric: "impressions", value: normalizeValue(tweet.impressions, "impressions") },
    { metric: "likes", value: normalizeValue(tweet.likes, "likes") },
    { metric: "comments", value: normalizeValue(tweet.comments, "comments") },
    { metric: "bookmarks", value: normalizeValue(tweet.bookmarks, "bookmarks") },
    { metric: "retweets", value: normalizeValue(tweet.retweets, "retweets") },
    { metric: "engagement_rate", value: normalizeValue(tweet.engagement_rate, "engagement_rate") },
  ];

  const renderPolarAngleAxis = ({ payload, x, y }: any) => {
    const icon = metricIcons[payload.value as keyof typeof metricIcons];
    const isSelectedMetric = payload.value === selectedMetric;

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject
          x="-12"
          y="-12"
          width="24"
          height="24"
          style={{
            color: isSelectedMetric ? "hsl(var(--primary))" : "hsl(var(--foreground))",
          }}
        >
          <div
            className={`h-full w-full flex items-center justify-center transition-colors
            ${isSelectedMetric ? "text-primary" : ""}`}
          >
            {icon}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="bg-background border rounded-lg p-4 shadow-lg">
      <p className="font-medium">{format(new Date(label), "MMM d, yyyy")}</p>
      <div className="w-[200px] h-[200px] mt-2">
        <ResponsiveContainer>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={renderPolarAngleAxis} />
            <Radar name="Metrics" dataKey="value" fill="hsl(var(--primary))" fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-1">
        <p className="font-medium">
          {metricLabels[payload[0].name.toLowerCase().replaceAll(" ", "_") as Metric]}:{" "}
          {tweet[selectedMetric].toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export function PerformanceChart({ chartData, onMetricChange }: PerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<Metric>("impressions");
  const maxValues = calculateMaxValues(chartData);

  const handleMetricChange = (value: string | undefined) => {
    if (value) {
      setSelectedMetric(value as Metric);
      onMetricChange?.(value as Metric);
    }
  };

  const handleBarClick = useCallback((data: any) => {
    if (data && data.url) {
      window.open(data.url, "_blank");
    }
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-lg font-medium">
          {selectedMetric.charAt(0).toUpperCase() +
            selectedMetric.slice(1).replaceAll("_", " ")}
        </div>
        <ToggleGroup
          type="single"
          value={selectedMetric}
          onValueChange={handleMetricChange}
          className="justify-start"
        >
          {(Object.keys(metricLabels) as Metric[]).map((key) => (
            <ToggleGroupItem
              key={key}
              value={key}
              aria-label={`Show ${metricLabels[key]}`}
              className="flex items-center gap-2"
            >
              {metricIcons[key as keyof typeof metricIcons]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="date" tickFormatter={(value: string) => format(new Date(value), "MMM d")} />
            <YAxis
              tickFormatter={(value: number) =>
                value >= 1_000_000
                  ? `${(value / 1_000_000).toFixed(1)}M`
                  : value >= 1_000
                    ? `${(value / 1_000).toFixed(1)}K`
                    : value.toString()
              }
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip {...props} selectedMetric={selectedMetric} maxValues={maxValues} />
              )}
            />
            <Legend />
            <Bar
              dataKey={selectedMetric}
              fill="hsl(var(--primary))"
              name={metricLabels[selectedMetric]}
              cursor="pointer"
              onClick={handleBarClick}
              data-parent={chartData}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
} 