import { render, screen, fireEvent } from "@testing-library/react-native";
import { Button } from "../components/ui/button";
import { Avatar } from "../components/ui/avatar";

describe("Button", () => {
  it("renders its label and fires onPress", () => {
    const onPress = jest.fn();
    render(<Button label="Confirm" onPress={onPress} />);

    fireEvent.press(screen.getByLabelText("Confirm"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire while loading", () => {
    const onPress = jest.fn();
    render(<Button label="Saving" onPress={onPress} loading />);

    fireEvent.press(screen.getByLabelText("Saving"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("Avatar", () => {
  it("derives initials from a full name", () => {
    render(<Avatar name="Olly Johnson" />);
    expect(screen.getByText("OJ")).toBeOnTheScreen();
  });

  it("falls back to a single letter pair for one-word names", () => {
    render(<Avatar name="Joga" />);
    expect(screen.getByText("JO")).toBeOnTheScreen();
  });
});
