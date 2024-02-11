import { ChakraProvider } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import reactToastifyStyle from "data-text:react-toastify/dist/ReactToastify.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, useRef, type FC } from "react";
import {
  toast,
  ToastContainer,
  type Id as ToastId,
  type ToastOptions,
} from "react-toastify";
import { safeParse } from "valibot";

import AskPostToastContent from "~components/ToastContent/AskPostToastContent";
import PostComplateToastContent from "~components/ToastContent/PostComplateToastContent";
import {
  MessageFromBackgroundSchema,
  type MessageFromBackground,
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

const sendMessageToBackground = async (message: unknown) => {
  console.log(`[sendMessage:tab(-)->background]`, message);
  return chrome.runtime.sendMessage(message);
};

type RuntimeMessageListener = Parameters<
  typeof chrome.runtime.onMessage.addListener
>[0];

const ContentScriptUi: FC = () => {
  const tweetIdAndToastIdMapRef = useRef<Record<string, ToastId>>({});

  useEffect(() => {
    // chrome の(型の)バグ？ (https://zwzw.hatenablog.com/entry/2019/12/04/200000)
    // Promise ではなく true を返さないと sendResponse の内容が background で受信できない (https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)
    const lister: RuntimeMessageListener = (rawMessage): true | void => {
      console.log("[onMessage:background->tab(-)]", rawMessage);

      const parseResult = safeParse(MessageFromBackgroundSchema, rawMessage);
      if (!parseResult.success) {
        return;
      }
      const message = parseResult.output;

      if (message.type === "askPostToBluesky") {
        const onRequestPost = () => {
          sendMessageToBackground({
            type: "requestPostToBluesky",
            tweetId: message.tweetId,
          } satisfies MessageFromBackground).catch((e) => console.error(e));
        };

        const toastId = toast(
          () => <AskPostToastContent onRequestPost={onRequestPost} />,
          { ...defaultToastOptions },
        );
        tweetIdAndToastIdMapRef.current[message.tweetId] = toastId;
      }

      if (message.type === "notifyPostResult") {
        const toastId = tweetIdAndToastIdMapRef.current[message.tweetId];
        delete tweetIdAndToastIdMapRef.current[message.tweetId];

        if (!toastId) {
          return;
        }

        toast.update(toastId, {
          render: () => <PostComplateToastContent />,
          ...defaultToastOptions,
        });
        return;
      }
    };

    chrome.runtime.onMessage.addListener(lister);
    return () => {
      chrome.runtime.onMessage.removeListener(lister);
    };
  }, []);

  return (
    <CacheProvider value={styleCache}>
      <ChakraProvider>
        <ToastContainer />
      </ChakraProvider>
    </CacheProvider>
  );
};

const styleElement = document.createElement("style");

const styleCache = createCache({
  key: "plasmo-emotion-cache",
  prepend: true,
  container: styleElement,
});
styleCache.sheet.insert(reactToastifyStyle.replace(":root", ":host"));
styleCache.sheet.insert(`
:host {
    --toastify-color-success: rgb(0, 112, 255);
  }
`);

export const getStyle: PlasmoGetStyle = () => styleElement;

export default ContentScriptUi;
