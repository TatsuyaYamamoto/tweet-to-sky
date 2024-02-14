import { saveTweetText } from "~helpers/twitter";
import { type MessageFromBackground } from "~types/MessageFromBackground";

export {};

const sendMessageToTab = async (tabId: number, message: unknown) => {
  console.log(`[sendMessage:background->tab(${tabId})]`, message);
  await chrome.tabs.sendMessage(tabId, message);
};

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

    const tweetId = saveTweetText(tweetText);

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
