import type { ReactNode } from "react";
import { View } from "react-native";

/** Pinned footer for a screen's main action. Give the scroll content enough bottom padding (pb-32). */
export function BottomActionBar({ children }: { children: ReactNode }) {
  return (
    <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background p-4 pb-8">
      {children}
    </View>
  );
}
