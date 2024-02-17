import { z } from "zod";

// chrome の(型の)バグ？ (https://zwzw.hatenablog.com/entry/2019/12/04/200000)
// Promise ではなく true を返さないと sendResponse の内容が background で受信できない (https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)
type RuntimeMessageListener = (
  ...args: Parameters<
    Parameters<typeof chrome.runtime.onMessage.addListener>[0]
  >
) => true | void;

export const AskPostToBlueskyMessageSchema = z.object({
  type: z.literal("askPostToBluesky"),
  tweetId: z.string(),
  tweetText: z.string(),
});
export type AskPostToBlueskyMessage = z.infer<
  typeof AskPostToBlueskyMessageSchema
>;

export const onAskPostToBluesky = (
  callback: (message: AskPostToBlueskyMessage) => void,
) => {
  const lister: RuntimeMessageListener = (rawMessage): true | void => {
    console.log("[onMessage:askPostToBluesky] background->tab(-)", rawMessage);

    const parseResult = AskPostToBlueskyMessageSchema.safeParse(rawMessage);
    if (!parseResult.success) {
      return;
    }

    callback(parseResult.data);
  };

  chrome.runtime.onMessage.addListener(lister);

  const unsubscribe = () => {
    chrome.runtime.onMessage.removeListener(lister);
  };

  return unsubscribe;
};
