import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Venue } from "@/lib/types";

export function useVenues() {
  return useQuery<Venue[]>({
    queryKey: ["venues"],
    queryFn: async () => {
      const { data } = await api.get<Venue[]>("/venues");
      return data;
    },
  });
}
