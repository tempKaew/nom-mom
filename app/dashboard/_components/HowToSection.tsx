"use client";

import Link from "next/link";
import { ChevronRightIcon, LightbulbIcon } from "@/components/icons";
import { HOW_TO_ARTICLES } from "../how-to/content";

export function HowToSection() {
  const featured = HOW_TO_ARTICLES.slice(0, 2);

  return (
    <section className="px-4 py-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
          <LightbulbIcon size={13} className="text-medical" />
          HOW TO
        </p>
        <Link
          href="/dashboard/how-to"
          className="text-[11px] text-medical font-medium"
        >
          ดูทั้งหมด
        </Link>
      </div>

      <div className="space-y-2.5">
        {featured.map((article) => (
          <Link
            key={article.slug}
            href={`/dashboard/how-to/${article.slug}`}
            className="block bg-white rounded-2xl px-3 py-3 shadow-sm border-l-[3px] border-medical"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-medical font-semibold">
                  {article.category} • {article.readTime}
                </p>
                <p className="text-sm font-bold text-gray-800 leading-snug mt-0.5">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {article.summary}
                </p>
              </div>
              <ChevronRightIcon
                size={14}
                className="text-gray-400 shrink-0 mt-1"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
