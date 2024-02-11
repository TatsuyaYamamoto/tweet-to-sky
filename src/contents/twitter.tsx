import reactToastifyStyle from "data-text:react-toastify/dist/ReactToastify.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, type FC } from "react";
import { toast, ToastContainer, type ToastOptions } from "react-toastify";
import { parse, safeParse } from "valibot";

import { TWITTER_API_ACCOUNT_MULTI_LIST_JSON } from "~constants";
import {
  MessageFromBackgroundSchema,
  RequestAccountListResultMessageSchema,
} from "~types/MessageFromBackground";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*"],
};

const defaultToastOptions: ToastOptions = {
  autoClose: 2000,
  position: "bottom-right",
  type: "success",
  theme: "colored",
};

const ContentScriptUi: FC = () => {
  useEffect(() => {
    type Listener = Parameters<typeof chrome.runtime.onMessage.addListener>[0];

    // chrome の(型の)バグ？ (https://zwzw.hatenablog.com/entry/2019/12/04/200000)
    // Promise ではなく true を返さないと sendResponse の内容が background で受信できない (https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)
    const handler: Listener = (rawMessage, _, sendResponse): void | boolean => {
      console.log("[onMessage:background->content-script]", rawMessage);

      const parseResult = safeParse(MessageFromBackgroundSchema, rawMessage);
      if (!parseResult.success) {
        return;
      }
      const message = parseResult.output;

      if (message.type === "postToBluesky") {
        toast(
          () => (
            <div>
              <div>{"送信完了 🦋"}</div>
              <pre>{message.value}</pre>
            </div>
          ),
          {
            ...defaultToastOptions,
          },
        );
        return;
      }

      if (message.type === "requestAccountList") {
        fetch(`${TWITTER_API_ACCOUNT_MULTI_LIST_JSON}?sw=1`, {
          credentials: "include",
        })
          .then((res) => res.json() as Promise<unknown>)
          .then((list) => {
            console.log(list);

            const response = parse(RequestAccountListResultMessageSchema, {
              type: "requestAccountListResult",
              value: list,
            });

            sendResponse(response);
            console.log(
              "[onMessage(response):content-script->background]",
              response,
            );
          })
          .catch((e) => console.error(e));

        return true;
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, []);

  return (
    <>
      <ToastContainer />
    </>
  );
};

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = `
  ${reactToastifyStyle.replace(":root", ":host")}
  :host {
    --toastify-color-success: rgb(0, 112, 255);
  }
  `;
  return style;
};

export default ContentScriptUi;
