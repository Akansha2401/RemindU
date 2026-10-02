import type { ReactNode } from "react";
import { View } from "react-native";
import { useObservable, useValue } from "@legendapp/state/react";
import { Button } from "./ui/button";
import { Icon, type IconName } from "./ui/icon";
import { Switch } from "./ui/switch";
import { Text } from "./ui/text";

type PermissionCardProps = {
  icon: IconName;
  title: string;
  /** Why RemindU needs it, always visible. */
  body: string;
  /** One-line reason shown after the first tap, before the system setting opens. */
  reason: string;
  badge: string;
  openLabel: string;
  granted: boolean;
  onRequest: () => void;
  /** Extra content under the reason, e.g. a phone-brand guide. */
  children?: ReactNode;
};

/**
 * A permission with a toggle. The first tap explains the reason in one line; the next tap
 * (on the toggle or the button) opens the system setting. Status is passed in by the parent.
 */
export function PermissionCard(props: PermissionCardProps) {
  const expanded$ = useObservable(false);
  const expanded = useValue(expanded$);

  function onToggle() {
    if (!expanded$.peek() && !props.granted) expanded$.set(true);
    else props.onRequest();
  }

  return (
    <View className="mb-3 rounded-card bg-card shadow-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-tile bg-background">
          <Icon name={props.icon} />
        </View>
        <View className="flex-1">
          <Text className="font-bold">{props.title}</Text>
          <Text className="text-caption font-bold uppercase tracking-widest text-muted-foreground">
            {props.badge}
          </Text>
        </View>
        <Switch checked={props.granted} onPress={onToggle} accessibilityLabel={props.title} />
      </View>
      <Text className="mt-3 text-sm text-walnut">{props.body}</Text>

      {expanded && !props.granted && (
        <View className="mt-3 gap-3 rounded-row bg-background p-3">
          <Text className="text-sm font-semibold">{props.reason}</Text>
          {props.children}
          <Button size="sm" onPress={props.onRequest} className="self-start">
            <Text>{props.openLabel}</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
