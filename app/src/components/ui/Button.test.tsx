import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its title and responds to press", async () => {
    const onPress = jest.fn();
    await render(<Button title="Sign In" onPress={onPress} />);

    fireEvent.press(screen.getByText("Sign In"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while loading", async () => {
    const onPress = jest.fn();
    await render(<Button title="Sign In" onPress={onPress} isLoading />);

    // While loading, the title text is replaced by a spinner, so it shouldn't be queryable.
    expect(screen.queryByText("Sign In")).toBeNull();
  });
});
