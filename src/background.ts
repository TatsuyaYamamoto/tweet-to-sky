import { BskyAgent, type AtpSessionData } from "@atproto/api";

import { Storage } from "@plasmohq/storage";

import { BLUESKY_SERVICE, STORAGE_API_KEYS } from "~constants";
import type { MessageFromBackground } from "~types/MessageFromBackground";

export {};

let bskyAgent: BskyAgent | null = null;

const getCurrentActiveTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
};

const sendMessageToContentScript = async (message: unknown) => {
  const tab = await getCurrentActiveTab();
  if (!tab?.id) {
    return;
  }

  await chrome.tabs.sendMessage(tab.id, message);
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
    // 2024/02/09: `https://twitter.com/i/api/graphql/8ED1SMuUGkOZVBEjiYUTfw/CreateTweet`
    const tweetApiPattern = new RegExp(
      "https://twitter\\.com/i/api/graphql/[0-9a-zA-Z]+/CreateTweet",
    );

    if (!(details.method === "POST" && tweetApiPattern.test(details.url))) {
      return;
    }

    const requestBodyByte = details.requestBody?.raw?.[0]?.bytes;

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

    console.log(details.url);
    console.log(details.method);
    console.log(details);
    console.log(tweetText);

    if (!tweetText) {
      return;
    }

    postToBluesky(tweetText)
      .then(async () => {
        await sendMessageToContentScript({
          type: "postToBluesky",
          value: tweetText,
        } satisfies MessageFromBackground).catch(() => null);
      })
      .catch(() => {
        // TODO: error handling
      });
  },
  {
    urls: ["https://twitter.com/i/api/*"],
    types: ["xmlhttprequest"],
  },
  ["requestBody"],
);
