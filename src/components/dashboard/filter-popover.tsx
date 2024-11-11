"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Filter,
  Users,
  Image,
  Link as LinkIcon,
  Quote,
  ScrollText,
  Heart,
  MessageCircle,
  Repeat,
} from "lucide-react";

export interface SearchFilters {
  verified: boolean;
  mediaOnly: boolean;
  linksOnly: boolean;
  threadOnly: boolean;
  quoteTweetsOnly: boolean;
  minLikes: string;
  minComments: string;
  minRetweets: string;
  dateRange: string;
}

interface FilterPopoverProps {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
}

export function FilterPopover({ filters, setFilters }: FilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-32px)] md:w-[480px] p-0">
        <div className="grid gap-4 p-6">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filters</h4>
            <p className="text-sm text-muted-foreground">Customize your search results</p>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="28d">Last 28 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tweet Type</Label>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="verified" className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Verified only</span>
                    </Label>
                    <Switch
                      id="verified"
                      checked={filters.verified}
                      onCheckedChange={(checked) => setFilters({ ...filters, verified: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mediaOnly" className="flex items-center space-x-2">
                      <Image className="h-4 w-4" />
                      <span>Media only</span>
                    </Label>
                    <Switch
                      id="mediaOnly"
                      checked={filters.mediaOnly}
                      onCheckedChange={(checked) => setFilters({ ...filters, mediaOnly: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="linksOnly" className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4" />
                      <span>Links only</span>
                    </Label>
                    <Switch
                      id="linksOnly"
                      checked={filters.linksOnly}
                      onCheckedChange={(checked) => setFilters({ ...filters, linksOnly: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quoteTweetsOnly" className="flex items-center space-x-2">
                      <Quote className="h-4 w-4" />
                      <span>Quotes only</span>
                    </Label>
                    <Switch
                      id="quoteTweetsOnly"
                      checked={filters.quoteTweetsOnly}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, quoteTweetsOnly: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="threadOnly" className="flex items-center space-x-2">
                      <ScrollText className="h-4 w-4" />
                      <span>Thread only</span>
                    </Label>
                    <Switch
                      id="threadOnly"
                      checked={filters.threadOnly}
                      onCheckedChange={(checked) => setFilters({ ...filters, threadOnly: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <Label>Minimum Metrics</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="minLikes" className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Likes</span>
                  </Label>
                  <Input
                    id="minLikes"
                    type="number"
                    value={filters.minLikes}
                    onChange={(e) => setFilters({ ...filters, minLikes: e.target.value })}
                    placeholder="Min likes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minComments" className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Comments</span>
                  </Label>
                  <Input
                    id="minComments"
                    type="number"
                    value={filters.minComments}
                    onChange={(e) => setFilters({ ...filters, minComments: e.target.value })}
                    placeholder="Min comments"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minRetweets" className="flex items-center space-x-2">
                    <Repeat className="h-4 w-4" />
                    <span>Retweets</span>
                  </Label>
                  <Input
                    id="minRetweets"
                    type="number"
                    value={filters.minRetweets}
                    onChange={(e) => setFilters({ ...filters, minRetweets: e.target.value })}
                    placeholder="Min retweets"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
