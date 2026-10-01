import { View } from "react-native";
import { router } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { strings } from "@/constants/strings";
import { missingPermissions } from "@/features/onboarding/logic";
import { REQUIRED_PERMISSIONS } from "@/lib/guard";
import { permissions$ } from "@/store/permissions.store";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

/** ONB-05: shown while a required permission is missing (timers can't run without them). */
export function PermissionBanner() {
  const missing = useValue(() => {
    const status = permissions$.status.get();
    return status ? missingPermissions(status, REQUIRED_PERMISSIONS) : [];
  });
  if (missing.length === 0) return null;
  const names = missing.map((k) => strings.onboarding.permissions.items[k].title.toLowerCase()).join(", ");
  return (
    <View className="mb-5 flex-row items-center gap-3 rounded-card bg-error-bg p-4">
      <View className="flex-1">
        <Text className="font-bold text-destructive">{strings.permissionBanner.title}</Text>
        <Text className="mt-0.5 text-sm text-walnut">{strings.permissionBanner.body(names)}</Text>
      </View>
      <Button size="sm" onPress={() => router.push("/settings/permissions")}>
        <Text>{strings.permissionBanner.cta}</Text>
      </Button>
    </View>
  );
}
