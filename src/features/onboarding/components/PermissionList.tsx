import { Linking, Pressable, View } from "react-native";
import * as Device from "expo-device";
import { PermissionCard } from "@/components/permission-card";
import type { IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { BRAND_GUIDES, detectBrand, dontKillMyAppUrl } from "@/config/onboarding";
import { strings } from "@/constants/strings";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { track } from "@/lib/analytics";
import { guard } from "@/lib/guard";
import { permissionActions, permissions$ } from "@/store/permissions.store";
import type { PermissionKind } from "@/types/guard";

const ITEMS: readonly { kind: PermissionKind; icon: IconName; required: boolean }[] = [
  { kind: "usage", icon: "eye", required: true },
  { kind: "overlay", icon: "layers", required: true },
  { kind: "notifications", icon: "bell", required: true },
  { kind: "battery", icon: "battery", required: false },
];

/** Reports the permission the user just went to grant (onboarding_step with permission + granted). */
function reportPending() {
  const kind = permissions$.pending.peek();
  const status = permissions$.status.peek();
  if (!kind || !status) return;
  track("onboarding_step", { step: "permissions", permission: kind, granted: status[kind] });
  permissions$.pending.set(null);
}

export function PermissionList() {
  // ONB-04: re-checked automatically when the user comes back from Settings.
  const status = usePermissionStatus(reportPending);
  const copy = strings.onboarding.permissions.items;

  async function request(kind: PermissionKind) {
    await permissionActions.request(kind);
    // Runtime prompts (and the mock) resolve without leaving the app, so report right away.
    if (kind === "notifications" || !guard.isNative) reportPending();
  }

  return (
    <View>
      {ITEMS.map((item) => (
        <PermissionCard
          key={item.kind}
          icon={item.icon}
          title={copy[item.kind].title}
          body={copy[item.kind].body}
          reason={copy[item.kind].reason}
          badge={item.required ? strings.common.required : strings.common.recommended}
          openLabel={strings.common.openSettings}
          granted={!!status?.[item.kind]}
          onRequest={() => request(item.kind)}
        >
          {item.kind === "battery" ? <BrandGuide /> : null}
        </PermissionCard>
      ))}
    </View>
  );
}

/** ONB-06: phone-brand steps for keeping RemindU alive, plus dontkillmyapp.com. */
function BrandGuide() {
  const brand = detectBrand(Device.manufacturer);
  const guide = brand ? BRAND_GUIDES[brand] : null;
  return (
    <View className="gap-1.5">
      {guide && (
        <>
          <Text className="text-label font-bold text-cocoa">
            {strings.onboarding.permissions.brandGuideTitle(guide.name)}
          </Text>
          {guide.steps.map((s, i) => (
            <Text key={s} className="text-sm text-walnut">
              {i + 1}. {s}
            </Text>
          ))}
        </>
      )}
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(dontKillMyAppUrl(brand))} hitSlop={6}>
        <Text className="text-sm font-semibold text-primary">{strings.onboarding.permissions.brandGuideLink}</Text>
      </Pressable>
    </View>
  );
}
