import { Pressable, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { TextClassContext } from "./text";

// Buttons are always full pills (DESIGN.md).
const buttonVariants = cva("flex-row items-center justify-center gap-2 rounded-full", {
  variants: {
    variant: {
      /** Coral with a brand glow: the one primary action on a screen. */
      default: "bg-primary shadow-cta active:scale-[0.98] active:bg-primary-hover",
      /** Ink. */
      secondary: "bg-secondary",
      /** White on cream, for neutral choices like "Continue with email". */
      outline: "bg-card shadow-badge",
      /** Dashed utility button. */
      tertiary: "border border-dashed border-dashline",
      ghost: "",
      link: "",
    },
    size: {
      default: "px-6 py-4",
      sm: "px-3.5 py-2",
      icon: "h-9 w-9 bg-card",
    },
  },
  compoundVariants: [{ variant: "tertiary", size: "default", className: "py-2.5" }],
  defaultVariants: { variant: "default", size: "default" },
});

const buttonTextVariants = cva("", {
  variants: {
    variant: {
      default: "font-semibold text-primary-foreground",
      secondary: "font-semibold text-secondary-foreground",
      outline: "font-semibold text-foreground",
      tertiary: "font-semibold text-muted-foreground",
      ghost: "font-semibold text-muted-foreground",
      link: "font-semibold text-primary",
    },
    size: {
      default: "text-button",
      sm: "text-label",
      icon: "text-button",
    },
  },
  compoundVariants: [{ variant: "tertiary", size: "default", className: "text-label" }],
  defaultVariants: { variant: "default", size: "default" },
});

export type ButtonProps = PressableProps & VariantProps<typeof buttonVariants> & { className?: string };

/** Wrap a `<Text>` from `@/components/ui/text`; it picks up the variant's text style. */
export function Button({ variant, size, className, disabled, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        className={cn(buttonVariants({ variant, size }), disabled && "opacity-50", className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}
