import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CompleteMatchPayload, MatchSummary } from "@/lib/types";

export function useCompleteMatch(matchId: string) {
  const queryClient = useQueryClient();

  return useMutation<MatchSummary, Error, CompleteMatchPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<MatchSummary>(
        `/matches/${matchId}/complete`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches", matchId] });
      queryClient.invalidateQueries({ queryKey: ["rating"] });
    },
  });
}
