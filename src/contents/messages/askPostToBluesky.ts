import { z } from "zod";

import type { RuntimeMessageListener } from "~shared/helpers/types";

export const AskPostToBlueskyMessageSchema = z.object({
  type: z.literal("askPostToBluesky"),
  tweetId: z.string(),
  tweetText: z.string(),
  mediaIds: z.string().array(),
});
export type AskPostToBlueskyMessage = z.infer<
  typeof AskPostToBlueskyMessageSchema
>;

export const onAskPostToBluesky = (
  callback: (message: AskPostToBlueskyMessage) => void,
) => {
  const lister: RuntimeMessageListener = (rawMessage): true | void => {
    const logPrefix = `[onMessage:askPostToBluesky]`;
    console.log(`${logPrefix} background->tab(-)`, rawMessage);

    const parseResult = AskPostToBlueskyMessageSchema.safeParse(rawMessage);
    if (!parseResult.success) {
      return;
    }

    callback(parseResult.data);
  };

  chrome.runtime.onMessage.addListener(lister);
  return () => {
    chrome.runtime.onMessage.removeListener(lister);
  };
};
