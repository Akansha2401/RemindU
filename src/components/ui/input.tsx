import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn("rounded-md border border-input px-3 py-2.5 text-base text-foreground", className)}
      {...props}
    />
  );
}
