import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Me {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export function useMe() {
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<Me>("/users/me");
      return data;
    },
  });
}
