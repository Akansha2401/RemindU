import { QueryClient } from "@tanstack/react-query";

/** The app's single QueryClient (provided in the root layout; cleared on sign-out). */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2 } },
});
