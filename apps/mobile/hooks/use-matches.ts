import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MatchDetail, MatchSummary } from "@/lib/types";

export function useMatches() {
  return useQuery<MatchSummary[]>({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data } = await api.get<MatchSummary[]>("/matches");
      return data;
    },
  });
}

export function useMatch(id: string | undefined) {
  return useQuery<MatchDetail>({
    queryKey: ["matches", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<MatchDetail>(`/matches/${id}`);
      return data;
    },
  });
}
