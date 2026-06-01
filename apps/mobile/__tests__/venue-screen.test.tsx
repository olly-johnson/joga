import { render, screen, fireEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider initialMetrics={initialMetrics}>{children}</SafeAreaProvider>
);

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: "v1" }),
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

const mockAt18 = new Date();
mockAt18.setHours(18, 0, 0, 0);
const mockJoinableMatchId = "match-joinable-1";

jest.mock("@/hooks/use-venues", () => ({
  useVenues: () => ({
    data: [
      {
        id: "v1",
        name: "Joga Cage Brixton",
        latitude: 51.4,
        longitude: -0.1,
        pitches: [
          { id: "pA", venueId: "v1", type: "FIVE_A_SIDE", surface: "3G" },
          { id: "pB", venueId: "v1", type: "FIVE_A_SIDE", surface: "4G" },
        ],
      },
    ],
  }),
}));

jest.mock("@/hooks/use-matches", () => ({
  useMatches: () => ({
    data: [
      {
        id: mockJoinableMatchId,
        pitchId: "pA",
        matchType: "RANKED",
        teamSelectionMode: "SELECTED",
        startTime: mockAt18.toISOString(),
        endTime: mockAt18.toISOString(),
        status: "BOOKED",
        homeScore: null,
        awayScore: null,
        pitch: { id: "pA", venueId: "v1", type: "FIVE_A_SIDE", surface: "3G", venue: {} },
        participants: [{ id: "x", matchId: mockJoinableMatchId, userId: "other", team: "HOME", createdAt: "" }],
      },
    ],
  }),
}));

jest.mock("@/hooks/use-me", () => ({
  useMe: () => ({ data: { id: "me" } }),
}));

import VenueScreen from "../app/venue/[id]";

describe("VenueScreen", () => {
  beforeEach(() => mockPush.mockClear());

  it("opens the booking flow when a free pitch-slot is tapped", () => {
    render(<VenueScreen />, { wrapper });

    fireEvent.press(screen.getByLabelText("Book 4G at 18:00"));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toContain("/book/pB");
  });

  it("opens the match when a joinable pitch-slot is tapped", () => {
    render(<VenueScreen />, { wrapper });

    fireEvent.press(screen.getByLabelText("Join 3G at 18:00"));

    expect(mockPush).toHaveBeenCalledWith(`/match/${mockJoinableMatchId}`);
  });
});
