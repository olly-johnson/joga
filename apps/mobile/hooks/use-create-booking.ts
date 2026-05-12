import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BookingResult, CreateBookingPayload } from "@/lib/types";

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<BookingResult, Error, CreateBookingPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<BookingResult>("/bookings", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}
