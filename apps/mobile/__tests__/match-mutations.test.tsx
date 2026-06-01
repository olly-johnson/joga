import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/lib/api", () => ({
  api: { post: jest.fn().mockResolvedValue({ data: { match: { id: "m1" } } }) },
}));

import { useJoinMatch } from "@/hooks/use-join-match";
import { useCreateBooking } from "@/hooks/use-create-booking";
import { useCompleteMatch } from "@/hooks/use-complete-match";

function setup() {
  const client = new QueryClient();
  const spy = jest.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { spy, wrapper };
}

const invalidatedMyMatches = (spy: jest.SpyInstance) =>
  spy.mock.calls.some(
    (c) => Array.isArray(c[0]?.queryKey) && c[0].queryKey[0] === "my-matches",
  );

describe("mutations refresh My Matches", () => {
  it("join invalidates my-matches", async () => {
    const { spy, wrapper } = setup();
    const { result } = renderHook(() => useJoinMatch("m1"), { wrapper });
    await result.current.mutateAsync({ team: "HOME" });
    await waitFor(() => expect(invalidatedMyMatches(spy)).toBe(true));
  });

  it("booking invalidates my-matches", async () => {
    const { spy, wrapper } = setup();
    const { result } = renderHook(() => useCreateBooking(), { wrapper });
    await result.current.mutateAsync({
      pitchId: "p1",
      matchType: "FRIENDLY",
      startTime: "2030-01-01T18:00:00Z",
      endTime: "2030-01-01T19:00:00Z",
      totalCost: 4500,
      teamSelectionMode: "SELECTED",
      bookerTeam: "HOME",
    });
    await waitFor(() => expect(invalidatedMyMatches(spy)).toBe(true));
  });

  it("complete invalidates my-matches", async () => {
    const { spy, wrapper } = setup();
    const { result } = renderHook(() => useCompleteMatch("m1"), { wrapper });
    await result.current.mutateAsync({ homeScore: 1, awayScore: 0 });
    await waitFor(() => expect(invalidatedMyMatches(spy)).toBe(true));
  });
});
