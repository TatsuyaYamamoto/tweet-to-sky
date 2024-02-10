import reactToastifyStyle from "data-text:react-toastify/dist/ReactToastify.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, type FC } from "react";
import { toast, ToastContainer, type ToastOptions } from "react-toastify";
import { safeParse } from "valibot";

import { MessageFromBackgroundSchema } from "~types/MessageFromBackground";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*"],
};

window.addEventListener("load", () => {
  console.log("content script loaded 🦋");
});

const defaultToastOptions: ToastOptions = {
  autoClose: 2000,
  position: "bottom-right",
  type: "success",
  theme: "colored",
};

const ContentScriptUi: FC = () => {
  useEffect(() => {
    type Handler = Parameters<typeof chrome.runtime.onMessage.addListener>[0];

    const handler: Handler = (rawMessage) => {
      const message = safeParse(MessageFromBackgroundSchema, rawMessage);
      if (!message.success) {
        return;
      }

      if (message.output.type === "postToBluesky") {
        toast(
          () => (
            <div>
              <div>{"送信完了 🦋"}</div>
              <pre>{message.output.value}</pre>
            </div>
          ),
          {
            ...defaultToastOptions,
          },
        );
        return;
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
