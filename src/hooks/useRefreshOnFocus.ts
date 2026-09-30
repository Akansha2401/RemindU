import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

export const useRefreshOnFocus = (refetch: () => void) => {
  const enabledRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (enabledRef.current) {
        refetch();
      } else {
        enabledRef.current = true;
      }
    }, [refetch]),
  );
};
