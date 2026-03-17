"use client";

import { useCallback, useState } from "react";
import { apiGet } from "@/services/api/client";
import type { MeData } from "@/types/app";

export function useMe(idToken: string | null) {
  const [data, setData] = useState<MeData | null>(null);

  const refetch = useCallback(async (): Promise<MeData | null> => {
    if (!idToken) return null;
    const result = await apiGet<MeData>("/api/me", idToken);
    if (!result.ok) throw new Error(result.error);
    setData(result.data);
    return result.data;
  }, [idToken]);

  return { data, setData, refetch };
}
