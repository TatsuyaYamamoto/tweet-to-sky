import { BskyAgent, type AtpSessionData } from "@atproto/api";
import { safeParse } from "valibot";

import { Storage } from "@plasmohq/storage";

import { BLUESKY_SERVICE, STORAGE_API_KEYS } from "~constants";
import {
  MessageFromBackgroundSchema,
  type MessageFromBackground,
} from "~types/MessageFromBackground";

export {};

let bskyAgent: BskyAgent | null = null;
const tweetMap: Record<string, string> = {};

const sendMessageToTab = async (tabId: number, message: unknown) => {
  console.log(`[sendMessage:background->tab(${tabId})]`, message);
  await chrome.tabs.sendMessage(tabId, message);
};

const postToBluesky = async (text: string) => {
  if (!bskyAgent) {
    bskyAgent = new BskyAgent({ service: BLUESKY_SERVICE });

    const session = await new Storage({ area: "local" }).get<AtpSessionData>(
      STORAGE_API_KEYS.BLUESKY_SESSION,
    );

    if (!session) {
      return;
    }

    await bskyAgent.resumeSession(session);
  }

  await bskyAgent.post({ text });
};

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { tabId, method, url, requestBody } = details;

    // 2024/02/09: `https://twitter.com/i/api/graphql/8ED1SMuUGkOZVBEjiYUTfw/CreateTweet`
    const tweetApiPattern = new RegExp(
      "https://twitter\\.com/i/api/graphql/[0-9a-zA-Z]+/CreateTweet",
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
    const tweetText =
      typeof json === "object" &&
      json !== null &&
      "variables" in json &&
      typeof json.variables === "object" &&
      json.variables !== null &&
      "tweet_text" in json.variables &&
      typeof json.variables.tweet_text === "string" &&
      json.variables.tweet_text;

    console.log(url);
    console.log(method);
    console.log(tweetText);

    if (!tweetText) {
      return;
    }

    const tweetId = crypto.randomUUID();
    tweetMap[tweetId] = tweetText;

    sendMessageToTab(tabId, {
      type: "askPostToBluesky",
      tweetId,
    } satisfies MessageFromBackground).catch((e) => {
      console.error(e);
    });
  },
  {
    urls: ["https://twitter.com/i/api/*"],
    types: ["xmlhttprequest"],
  },
  ["requestBody"],
);

chrome.runtime.onMessage.addListener((rawMessage, sender) => {
  const tabId = sender.tab?.id;
  console.log(`[onMessage:tab(${tabId})->background]`, rawMessage);

  const { success, output: message } = safeParse(
    MessageFromBackgroundSchema,
    rawMessage,
  );
  if (!success) {
    return;
  }

  if (message.type === "requestPostToBluesky") {
    const tweetText = tweetMap[message.tweetId];
    delete tweetMap[message.tweetId];
    if (tweetText && tabId) {
      postToBluesky(tweetText)
        .then(() => {
          return true;
        })
        .catch((e) => {
          console.error(e);
          return false;
        })
        .then((isSuccess) => {
          return sendMessageToTab(tabId, {
            type: "notifyPostResult",
            tweetId: message.tweetId,
            isSuccess,
          } satisfies MessageFromBackground);
        })
        .catch((e) => {
          console.error(e);
        });
    }
    return;
  }
});
