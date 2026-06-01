import { render, screen, fireEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider initialMetrics={initialMetrics}>{children}</SafeAreaProvider>
);

const mockReplace = jest.fn();
let mockBookImpl: (payload: unknown, opts: any) => void = () => {};
let mockIsPending = false;

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ pitchId: "pitch-1" }),
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/hooks/use-venues", () => ({
  useVenues: () => ({
    data: [
      {
        id: "v1",
        name: "Joga Cage Brixton",
        pitches: [{ id: "pitch-1", type: "FIVE_A_SIDE", surface: "3G" }],
      },
    ],
  }),
}));

jest.mock("@/hooks/use-create-booking", () => ({
  useCreateBooking: () => ({
    mutate: (payload: unknown, opts: any) => mockBookImpl(payload, opts),
    isPending: mockIsPending,
  }),
}));

import BookingScreen from "../app/book/[pitchId]";

describe("BookingScreen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockBookImpl = () => {};
    mockIsPending = false;
  });

  it("navigates to the match detail on a successful booking", () => {
    mockBookImpl = (_payload, opts) => opts.onSuccess({ match: { id: "m1" } });
    render(<BookingScreen />, { wrapper });

    fireEvent.press(screen.getByLabelText("Confirm booking"));

    expect(mockReplace).toHaveBeenCalledWith("/match/m1");
  });

  it("shows an inline conflict message when the slot is already booked (409)", () => {
    mockBookImpl = (_payload, opts) => opts.onError({ response: { status: 409 } });
    render(<BookingScreen />, { wrapper });

    fireEvent.press(screen.getByLabelText("Confirm booking"));

    expect(screen.getByText(/already booked/i)).toBeOnTheScreen();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
