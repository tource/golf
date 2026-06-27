import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** 역대 참여자에서 중복 제거한 이름 목록 */
export function useMemberNames() {
  const [names, setNames] = useState<string[]>([]);
  const supabase = createClient();

  const fetchNames = useCallback(async () => {
    const { data } = await supabase
      .from("participants")
      .select("name")
      .order("name");

    if (data) {
      const unique = [...new Set(data.map((p) => p.name.trim()))].filter(
        Boolean,
      );
      setNames(unique.sort((a, b) => a.localeCompare(b, "ko")));
    }
  }, [supabase]);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  return { names, refresh: fetchNames };
}
