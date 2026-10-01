import { TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { FONT_FAMILY } from "@/lib/theme";
import { Icon } from "./icon";

/** Pill search field with a magnifier. */
export function SearchInput(props: TextInputProps) {
  const theme = useTheme();
  return (
    <View className="flex-row items-center gap-2 rounded-full bg-muted px-4">
      <Icon name="search" size={18} color={theme.mutedForeground} />
      <TextInput
        className="flex-1 py-3 text-body text-foreground"
        placeholderTextColor={theme.mutedForeground}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={{ fontFamily: FONT_FAMILY.normal }}
        {...props}
      />
    </View>
  );
}
