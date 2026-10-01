import { Pressable, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

type IconButtonProps = PressableProps & {
  icon: IconName;
  /** circle = 36px nav button, tile = 40px header action (12px radius). */
  shape?: "circle" | "tile";
  accessibilityLabel: string;
  className?: string;
};

export function IconButton({ icon, shape = "circle", className, ...props }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      className={cn(
        "items-center justify-center bg-card",
        shape === "circle" ? "h-9 w-9 rounded-full" : "h-10 w-10 rounded-tile",
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={shape === "circle" ? 16 : 18} />
    </Pressable>
  );
}
