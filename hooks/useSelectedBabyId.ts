"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "nom-mom-selected-baby";

export function useSelectedBabyId(babies: { id: string }[]) {
  const [selectedBabyId, setSelectedBabyIdState] = useState<string | null>(null);

  useEffect(() => {
    if (!babies.length) return;
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const validId =
      stored && babies.find((b) => b.id === stored) ? stored : babies[0].id;
    setSelectedBabyIdState(validId);
  }, [babies]);

  const setSelectedBabyId = (id: string) => {
    if (typeof window !== "undefined")
      localStorage.setItem(STORAGE_KEY, id);
    setSelectedBabyIdState(id);
  };

  return [selectedBabyId, setSelectedBabyId] as const;
}
