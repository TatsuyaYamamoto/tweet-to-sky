import { literal, object, safeParse, string, type Output } from "valibot";

// chrome の(型の)バグ？ (https://zwzw.hatenablog.com/entry/2019/12/04/200000)
// Promise ではなく true を返さないと sendResponse の内容が background で受信できない (https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)
type RuntimeMessageListener = (
  ...args: Parameters<
    Parameters<typeof chrome.runtime.onMessage.addListener>[0]
  >
) => true | void;

export const AskPostToBlueskyMessageSchema = object({
  type: literal("askPostToBluesky"),
  tweetId: string(),
});
export type AskPostToBlueskyMessage = Output<
  typeof AskPostToBlueskyMessageSchema
>;

export const onAskPostToBlueskyMessage = (
  callback: (message: AskPostToBlueskyMessage) => void,
) => {
  const lister: RuntimeMessageListener = (rawMessage): true | void => {
    const parseResult = safeParse(AskPostToBlueskyMessageSchema, rawMessage);
    if (!parseResult.success) {
      return;
    }

    console.log("[onMessage:background->tab(-)]", rawMessage);
    callback(parseResult.output);
  };

  chrome.runtime.onMessage.addListener(lister);

  const unsubscribe = () => {
    chrome.runtime.onMessage.removeListener(lister);
  };

  return unsubscribe;
};
