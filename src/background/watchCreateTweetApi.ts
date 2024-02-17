import { z } from "zod";

import type { AskPostToBlueskyMessage } from "~contents/messages/askPostToBluesky";
import { saveTweetText } from "~helpers/twitter";

export const CreateTweetApiResponseSchema = z.object({
  variables: z.object({
    tweet_text: z.string(),
  }),
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { tabId, method, url, requestBody } = details;

    // 2024/02/09: `https://twitter.com/i/api/graphql/8ED1SMuUGkOZVBEjiYUTfw/CreateTweet`
    // 2024/02/15: `https://twitter.com/i/api/graphql/_BCvBRcat20zPDIAxmH5ag/CreateTweet`
    const tweetApiPattern = new RegExp(
      "https://twitter\\.com/i/api/graphql/[^/]+/CreateTweet",
    );

    if (!(method === "POST" && tweetApiPattern.test(url))) {
      return;
    }

    const requestBodyByte = requestBody?.raw?.[0]?.bytes;

    if (!requestBodyByte) {
      return;
    }

    const json = JSON.parse(
      new TextDecoder("utf-8").decode(requestBodyByte),
    ) as unknown;
    const {
      variables: { tweet_text: tweetText },
    } = CreateTweetApiResponseSchema.parse(json);

    console.log(`${method} ${url}`, tweetText);

    if (!tweetText) {
      return;
    }

    const tweetId = saveTweetText(tweetText);

    const message = {
      type: "askPostToBluesky",
      tweetId,
      tweetText,
    } satisfies AskPostToBlueskyMessage;
    console.log(
      `[messaging:askPostToBluesky] background->tab(${tabId})`,
      message,
    );
    chrome.tabs.sendMessage(tabId, message).catch((e) => {
      console.error(e);
    });
  },
  {
    urls: ["https://twitter.com/i/api/*"],
    types: ["xmlhttprequest"],
  },
  ["requestBody"],
);
