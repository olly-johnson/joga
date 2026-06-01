import { Text, View } from "react-native";
import { render, screen } from "@testing-library/react-native";

function Hello() {
  return (
    <View className="bg-joga-dark">
      <Text>cage on</Text>
    </View>
  );
}

describe("test harness sanity", () => {
  it("renders a component with a nativewind className", () => {
    render(<Hello />);
    expect(screen.getByText("cage on")).toBeOnTheScreen();
  });
});
