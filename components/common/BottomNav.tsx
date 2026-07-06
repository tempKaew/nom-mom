"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ClockIcon, BarChartIcon, HeartPulseIcon, UserIcon } from "@/components/icons";
import { MESSAGES } from "@/constants/messages";

export function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/dashboard";
  const isLog = pathname.startsWith("/dashboard/log");
  const isGrowth = pathname === "/dashboard/growth";
  const isMedical = pathname === "/dashboard/medical";
  const isProfile = pathname === "/dashboard/profile";

  const tabs = [
    { href: "/dashboard", label: MESSAGES.UI.NAV_HOME, icon: <HomeIcon size={22} />, active: isHome },
    { href: "/dashboard/log", label: MESSAGES.UI.NAV_LOG, icon: <ClockIcon size={22} />, active: isLog },
    { href: "/dashboard/growth", label: MESSAGES.UI.NAV_GROWTH, icon: <BarChartIcon size={22} />, active: isGrowth },
    { href: "/dashboard/medical", label: MESSAGES.UI.NAV_MEDICAL, icon: <HeartPulseIcon size={22} />, active: isMedical },
    { href: "/dashboard/profile", label: MESSAGES.UI.NAV_PROFILE, icon: <UserIcon size={22} />, active: isProfile },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-end justify-around px-1"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex flex-col items-center pt-2 px-3 gap-0.5 transition-colors ${
            tab.active ? "text-blue-500" : "text-gray-400"
          }`}
        >
          {tab.icon}
          <span className="text-[10px] font-medium pb-1">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
