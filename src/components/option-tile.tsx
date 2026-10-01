import { Pressable, View } from "react-native";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./ui/icon";
import { Text } from "./ui/text";

type OptionTileProps = {
  label: string;
  description?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  /** row = full-width list option; tile = grid cell with the icon on top. */
  layout?: "row" | "tile";
  className?: string;
};

/** Single-select answer. Selected = light orange fill + orange border. */
export function OptionTile({ label, description, icon, selected, onPress, layout = "row", className }: OptionTileProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      onPress={onPress}
      className={cn(
        "rounded-card border-2 p-4",
        selected ? "border-primary bg-accent" : "border-transparent bg-card",
        layout === "row" ? "flex-row items-center gap-3" : "min-h-[112px] justify-between gap-3",
        className,
      )}
    >
      {icon && (
        <View className={cn("h-10 w-10 items-center justify-center rounded-tile", selected ? "bg-card" : "bg-background")}>
          <Icon name={icon} />
        </View>
      )}
      <View className={layout === "row" ? "flex-1" : undefined}>
        <Text className="font-bold">{label}</Text>
        {description ? <Text className="mt-0.5 text-caption text-muted-foreground">{description}</Text> : null}
      </View>
    </Pressable>
  );
}
