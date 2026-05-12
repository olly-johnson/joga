import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RatingResponse } from "@/lib/types";

export function useRating() {
  return useQuery<RatingResponse>({
    queryKey: ["rating"],
    queryFn: async () => {
      const { data } = await api.get<RatingResponse>("/users/me/rating");
      return data;
    },
  });
}
