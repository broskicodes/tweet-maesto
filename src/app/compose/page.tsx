"use client";

import Footer from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LeftSidebar } from "@/components/compose/left-sidebar";
import { MainView } from "@/components/compose/main-view";
import { RightSidebar } from "@/components/compose/right-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";

export default function New() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-screen w-full bg-background relative">
      <main className="flex-1 flex flex-col h-screen w-full bg-background">
        <div className="flex flex-1 min-h-screen">
          <SidebarProvider defaultOpen={leftOpen} open={leftOpen} onOpenChange={setLeftOpen}>
            <LeftSidebar />
            <div className="flex-1">
              <SidebarProvider defaultOpen={rightOpen} open={rightOpen} onOpenChange={setRightOpen}>
                <div className="flex w-full">
                  <MainView
                    onLeftToggle={() => setLeftOpen(!leftOpen)}
                    onRightToggle={() => setRightOpen(!rightOpen)}
                  />
                  <RightSidebar />
                </div>
              </SidebarProvider>
            </div>
          </SidebarProvider>
        </div>
      </main>
      <Footer />
    </div>
  );
}