import { BskyAgent, type AtpSessionData } from "@atproto/api";
import { parse } from "valibot";

import { Storage } from "@plasmohq/storage";

import {
  BLUESKY_SERVICE,
  RULE_IDS,
  STORAGE_API_KEYS,
  TWITTER_API_ACCOUNT_MULTI_LIST_JSON,
} from "~constants";
import {
  RequestAccountListResultMessageSchema,
  type MessageFromBackground,
  type RequestAccountListMessage,
} from "~types/MessageFromBackground";

import RuleActionType = chrome.declarativeNetRequest.RuleActionType;
import HeaderOperation = chrome.declarativeNetRequest.HeaderOperation;

export {};

const screenNameAndUserIdMap: Record<string, string> = {};

let bskyAgent: BskyAgent | null = null;

// const getCurrentActiveTab = async () => {
//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//   return tab;
// };

const sendMessageToContentScript = async (tabId: number, message: unknown) => {
  await chrome.tabs.sendMessage(tabId, message);
};

const requestAccountListToContentScript = async (tabId: number) => {
  const message = {
    type: "requestAccountList",
  } satisfies RequestAccountListMessage;
  const response: unknown = await chrome.tabs.sendMessage(tabId, message);
  console.log("[message(response)]:content-script->background ", response);

  parse(RequestAccountListResultMessageSchema, response).value.users.forEach(
    (user) => {
      screenNameAndUserIdMap[user.screen_name] = user.user_id;
    },
  );
};

const logDynamicRules = async () => {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  console.log("[declarativeNetRequest] dynamicRules", rules);
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

    postToBluesky(tweetText)
      .then(async () => {
        await sendMessageToContentScript(tabId, {
          type: "postToBluesky",
          value: tweetText,
        } satisfies MessageFromBackground).catch(() => null);
      })
      .catch((e) => {
        // TODO: error handling
        console.error(e);
      });
  },
  {
    urls: ["https://twitter.com/i/api/*"],
    types: ["xmlhttprequest"],
  },
  ["requestBody"],
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const { tabId, method, url, requestHeaders } = details;
    console.log(`tab(${tabId}) -> `, method, url, requestHeaders);

    if (!requestHeaders || method !== "GET") {
      // preflight は以降の処理に使わない
      return;
    }

    const requiredHeaderNames = ["authorization", "x-csrf-token"];
    const requestHeaderMap = Object.fromEntries(
      requestHeaders.map(({ name, value }) => [name, value]),
    );

    chrome.declarativeNetRequest
      .updateDynamicRules({
        removeRuleIds: [RULE_IDS.ACCOUNT_LIST_HEADER],
        addRules: [
          {
            action: {
              type: RuleActionType.MODIFY_HEADERS,
              requestHeaders: requiredHeaderNames.map((requiredHeaderName) => {
                return {
                  operation: HeaderOperation.SET,
                  header: requiredHeaderName,
                  value: requestHeaderMap[requiredHeaderName],
                };
              }),
              responseHeaders: [
                {
                  operation: HeaderOperation.SET,
                  header: "X-TWEET-TO-SKY-DYNAMIC-RULE-ID",
                  value: `${RULE_IDS.ACCOUNT_LIST_HEADER}`,
                },
              ],
            },
            condition: {
              urlFilter: TWITTER_API_ACCOUNT_MULTI_LIST_JSON,
            },
            id: RULE_IDS.ACCOUNT_LIST_HEADER,
            priority: 1,
          },
        ],
      })
      .then(() => logDynamicRules())
      .then(() => {
        return requestAccountListToContentScript(tabId);
      })
      .catch((e) => console.error(e));
  },
  {
    urls: [TWITTER_API_ACCOUNT_MULTI_LIST_JSON],
  },
  ["requestHeaders"],
);

chrome.declarativeNetRequest
  .updateDynamicRules({
    removeRuleIds: [RULE_IDS.ACCOUNT_LIST_HEADER],
  })
  .then(() => logDynamicRules())
  .catch((e) => console.error(e));
