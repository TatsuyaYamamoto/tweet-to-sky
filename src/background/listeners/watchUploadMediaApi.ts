import type { EnsureMediaMessage } from "~contents/messages/ensureMedia";

const initializedMediaTypeMap: Record<string /* mediaId */, string> = {};

chrome.webRequest.onCompleted.addListener(
  (details) => {
    const { tabId, method, url: rawUrl, responseHeaders } = details;

    if (method === "OPTIONS") {
      // preflight should be ignored
      return;
    }

    // https://upload.twitter.com/i/media/upload.json?command=INIT&total_bytes=2623&media_type=image%2Fpng&media_category=tweet_image
    // https://upload.twitter.com/i/media/upload.json?command=APPEND&media_id=1759613770253627392&segment_index=0
    // https://upload.twitter.com/i/media/upload.json?command=FINALIZE&media_id=1759613770253627392&original_md5=af5ebf61786c366d33e9b3b732d6d258
    const url = new URL(rawUrl);
    const command = url.searchParams.get("command");
    const mediaType = url.searchParams.get("media_type");
    const originalMd5 = url.searchParams.get("original_md5");
    const responseHeaderMap = Object.fromEntries(
      responseHeaders?.map(({ name, value }) => {
        return [name.toLowerCase(), value];
      }) ?? [],
    );
    const mediaId = responseHeaderMap["x-mediaid"];

    if (command === "INIT" && mediaId && mediaType) {
      initializedMediaTypeMap[mediaId] = mediaType;
      return;
    }

    if (command === "APPEND") {
      return;
    }

    if (command === "FINALIZE" && mediaId && originalMd5) {
      const mediaType = initializedMediaTypeMap[mediaId];
      delete initializedMediaTypeMap[mediaId];

      if (!mediaType) {
        return;
      }

      const message: EnsureMediaMessage = {
        type: "ensureMedia",
        mediaId,
        md5: originalMd5,
        mediaType,
      };
      console.log(`[messaging:ensureMedia] background->tab(${tabId})`, message);
      chrome.tabs.sendMessage(tabId, message).catch((e) => {
        console.error(e);
      });
      return;
    }
  },
  {
    urls: ["https://upload.twitter.com/i/media/upload.json?*"],
    types: ["xmlhttprequest"],
  },
  ["responseHeaders"],
);
