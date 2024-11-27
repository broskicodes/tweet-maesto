import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Metric, metricLabels } from "@/lib/types";
import { ChartData, metricIcons } from "./shared";
import { Tweet } from "@/lib/types";
import { TweetRangeModal } from "./tweet-range-modal";

interface HistogramProps {
  data: ChartData[];
  tweets: Tweet[];
}

export function calculateStats(numbers: number[]) {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev };
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function createLogBins(values: number[], numBins = 7) {
  const nonZeroValues = values.filter((v) => v > 0);
  const minValue = Math.min(...nonZeroValues);
  const maxValue = Math.max(...nonZeroValues);

  const logMin = Math.log(Math.max(minValue, 1));
  const logMax = Math.log(maxValue);
  const logStep = (logMax - logMin) / numBins;

  const bins = Array.from({ length: numBins }, (_, i) => {
    const binStartLog = logMin + i * logStep;
    const binEndLog = logMin + (i + 1) * logStep;
    return {
      binStart: Math.exp(binStartLog),
      binEnd: Math.exp(binEndLog),
      count: 0,
      tweetIds: new Set<string>(),
      label: `${formatNumber(Math.round(Math.exp(binStartLog)))} - ${formatNumber(Math.round(Math.exp(binEndLog)))}`,
    };
  });

  values.forEach((value) => {
    if (value <= 0) return;
    const binIndex = bins.findIndex((bin) => value <= bin.binEnd);
    if (binIndex >= 0) bins[binIndex].count++;
  });

  return bins;
}

export function ViewsHistogram({ data, tweets }: HistogramProps) {
  const [selectedMetric, setSelectedMetric] = useState<Metric>("impressions");
  const [selectedRange, setSelectedRange] = useState<{
    tweets: Tweet[];
    range: string;
  } | null>(null);

  const histogramData = useMemo(() => {
    const values = data.map((d) => ({ value: d[selectedMetric], id: d.id }));
    const stats = calculateStats(values.map((v) => v.value));

    const bins = createLogBins(values.map((v) => v.value));

    values.forEach(({ value, id }) => {
      if (value <= 0) return;
      const binIndex = bins.findIndex((bin) => value <= bin.binEnd);
      if (binIndex >= 0) {
        if (!bins[binIndex].tweetIds) bins[binIndex].tweetIds = new Set();
        bins[binIndex].tweetIds.add(id);
      }
    });

    return { bins, stats };
  }, [data, selectedMetric]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-lg font-medium">
            {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1).replaceAll("_", " ")}
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground font-medium">
            <span>μ = {formatNumber(Math.round(histogramData.stats.mean))}</span>
            <span>σ = {formatNumber(Math.round(histogramData.stats.stdDev))}</span>
          </div>
        </div>
        <ToggleGroup
          type="single"
          value={selectedMetric}
          onValueChange={(value) => value && setSelectedMetric(value as Metric)}
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
          <BarChart data={histogramData.bins}>
            <XAxis
              dataKey="label"
              angle={-45}
              textAnchor="end"
              height={70}
              interval={0}
              fontSize={12}
            />
            <YAxis />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload?.length) return null;
                return (
                  <div className="bg-popover/95 border rounded-lg p-3 shadow-lg backdrop-blur-sm">
                    <div className="grid gap-2 text-sm">
                      <div className="font-medium text-popover-foreground">
                        {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
                      </div>
                      <div className="grid gap-1 text-muted-foreground">
                        <div className="flex justify-between gap-8">
                          <span>Count:</span>
                          <span className="font-medium text-foreground">
                            {formatNumber(payload[0].value as number)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span>Range:</span>
                          <span className="font-medium text-foreground">{label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              opacity={0.9}
              onClick={(data: any) => {
                const binTweets = tweets.filter((t) => data.tweetIds?.has(t.tweet_id));
                setSelectedRange({
                  tweets: binTweets,
                  range: data.label,
                });
              }}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {selectedRange && (
        <TweetRangeModal
          open={!!selectedRange}
          onOpenChange={(open) => !open && setSelectedRange(null)}
          tweets={selectedRange.tweets}
          metric={selectedMetric}
          range={selectedRange.range}
        />
      )}
    </div>
  );
}
