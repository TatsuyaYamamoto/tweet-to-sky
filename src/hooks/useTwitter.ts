import { useCallback } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/dist/hook";

import { STORAGE_API_KEYS } from "~constants";

export const useTwitter = () => {
  const [savedScreenName, saveScreenName] = useStorage<string>({
    key: STORAGE_API_KEYS.TWITTER_SCREEN_NAME,
    instance: new Storage({ area: "local" }),
  });

  const setScreenName = useCallback(
    async (value: string) => {
      await saveScreenName(value);
    },
    [saveScreenName],
  );

  return {
    screenName: savedScreenName,
    setScreenName,
  };
};
