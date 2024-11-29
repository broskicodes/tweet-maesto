import { FC, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import {
  Sparkles,
  LayoutDashboard,
  ExternalLink,
  LogOut,
  ChevronUp,
  ChevronDown,
  PenSquare,
  Calendar,
  GalleryVerticalEnd,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useViewStore, type View } from "@/store/views";
import { PricingModal } from "../layout/pricing-modal";
import posthog from "posthog-js";

const links = [
  {
    title: "Go to Dashboard",
    link: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
  },
];

const navItems = [
  {
    title: "Planner",
    view: "planner" as View,
    icon: <GalleryVerticalEnd className="h-4 w-4" />,
  },
  {
    title: "Compose",
    view: "compose" as View,
    icon: <PenSquare className="h-4 w-4" />,
  },
  {
    title: "Calendar",
    view: "calendar" as View,
    icon: <Calendar className="h-4 w-4" />,
  },
];

export const LeftSidebar: FC = () => {
  const { data: session } = useSession();
  const isSubscribed = session?.user?.subscribed;
  const [footerOpen, setFooterOpen] = useState(true);
  const { currentView, setView } = useViewStore();
  const [showPricing, setShowPricing] = useState(false);
  return (
    <div className="relative h-[calc(100vh-3rem)]">
      <Sidebar side="left" collapsible="offcanvas" className="!absolute !h-full">
        <SidebarHeader className="h-14 border-b flex items-center px-4">
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex w-full items-center gap-2 -ml-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://unavatar.io/twitter/${session.user.handle}`} />
                    <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-base font-medium">{session.user.name}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="font-normal text-muted-foreground">
                  Logged in as{" "}
                  <span className="font-medium text-foreground">@{session.user.handle}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a
                    href={`https://twitter.com/${session.user.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    Visit Twitter Profile
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign out
                  <LogOut className="ml-auto h-4 w-4" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="mt-8 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.title}
                onClick={() => setView(item.view)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-sm font-medium",
                  currentView === item.view
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {item.icon}
                {item.title}
              </button>
            ))}
          </SidebarGroup>
        </SidebarContent>
        <div className="relative">
          {footerOpen && (
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background shadow-sm border"
                onClick={() => setFooterOpen(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!footerOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-background shadow-sm border"
              onClick={() => setFooterOpen(true)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
          <div
            className={cn(
              "transition-all duration-200 ease-in-out border-t",
              footerOpen ? "h-auto opacity-100" : "h-0 opacity-0 overflow-hidden",
            )}
          >
            <SidebarFooter>
              <Link href="/" className="flex items-center px-1">
                <Logo scale={0.5} />
                <span className="font-heading text-lg font-bold mt-1">Tweet Maestro</span>
              </Link>
              <nav className="flex flex-col gap-1 pb-2 px-2">
                {links.map((link) => (
                  <Link
                    key={link.title}
                    href={link.link}
                    className="flex w-full cursor-pointer items-center rounded-md p-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {link.icon}
                    {link.title}
                  </Link>
                ))}
              </nav>
              <div className="p-2">
                {session && (
                  <Button
                    onClick={() => {
                      posthog.capture("upgrade-popup", {
                        trigger: "compose-sidebar",
                      });
                      setShowPricing(true);
                    }}
                    variant={"default"}
                    className="w-full"
                    disabled={!!isSubscribed}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isSubscribed ? "Thanks for Supporting!" : "Upgrade to Pro"}
                  </Button>
                )}
              </div>
            </SidebarFooter>
          </div>
        </div>
      </Sidebar>
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
};
