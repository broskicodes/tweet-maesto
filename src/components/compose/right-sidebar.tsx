import { FC } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarGroup } from "@/components/ui/sidebar";

export const RightSidebar: FC = () => {
  return (
    <div className="relative h-[calc(100vh)]">
      <Sidebar side="right" collapsible="offcanvas" className="!absolute !h-full">
        <SidebarHeader className="h-14 border-b" />
        <SidebarContent>
          <SidebarGroup>{/* Add your right sidebar content here */}</SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </div>
  );
};
