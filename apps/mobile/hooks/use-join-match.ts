import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JoinMatchPayload, MatchParticipant } from "@/lib/types";

export function useJoinMatch(matchId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ participant: MatchParticipant }, Error, JoinMatchPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/matches/${matchId}/join`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches", matchId] });
    },
  });
}
