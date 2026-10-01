import { Pressable, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { TextClassContext } from "./text";

const buttonVariants = cva("items-center justify-center", {
  variants: {
    variant: {
      default: "bg-primary",
      secondary: "bg-secondary",
      outline: "border border-border",
      ghost: "",
    },
    size: {
      default: "rounded-lg py-3.5",
      sm: "rounded-md px-3 py-1.5",
      icon: "h-11 w-11 rounded-full",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

const buttonTextVariants = cva("", {
  variants: {
    variant: {
      default: "font-semibold text-primary-foreground",
      secondary: "font-medium text-secondary-foreground",
      outline: "text-foreground",
      ghost: "text-muted-foreground",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      icon: "text-xl",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export type ButtonProps = PressableProps & VariantProps<typeof buttonVariants> & { className?: string };

/** Wrap a `<Text>` from `@/components/ui/text`; it picks up the variant's text style. */
export function Button({ variant, size, className, disabled, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        disabled={disabled}
        className={cn(buttonVariants({ variant, size }), disabled && "opacity-40", className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}
