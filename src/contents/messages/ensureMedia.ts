import { z } from "zod";

export const EnsureMediaMessageSchema = z.object({
  type: z.literal("ensureMedia"),
  mediaId: z.string(),
  md5: z.string(),
  mediaType: z.string(),
});

export type EnsureMediaMessage = z.infer<typeof EnsureMediaMessageSchema>;

export const onEnsureMedia = (
  callback: (message: EnsureMediaMessage) => void,
) => {
  const listener = (rawMessage: unknown) => {
    const logPrefix = `[onMessage:ensureMedia]`;
    console.log(`${logPrefix} background->tab(-)`, rawMessage);

    const parseResult = EnsureMediaMessageSchema.safeParse(rawMessage);
    if (!parseResult.success) {
      return;
    }

    callback(parseResult.data);
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
};
