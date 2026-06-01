import Feather from "@expo/vector-icons/Feather";
import { colors } from "@/constants/Colors";

export type IconName = React.ComponentProps<typeof Feather>["name"];

/**
 * Single line-icon wrapper for the app. Standardising on Feather keeps the
 * iconography consistent and rules out the dated FontAwesome glyphs.
 */
export function Icon({
  name,
  size = 20,
  color = colors.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
