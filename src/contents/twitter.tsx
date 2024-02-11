import { ChakraProvider } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import reactToastifyStyle from "data-text:react-toastify/dist/ReactToastify.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, type FC } from "react";
import { toast, ToastContainer, type ToastOptions } from "react-toastify";
import { safeParse } from "valibot";

import { sendRequestPostToBluesky } from "~background/messages/requestPostToBluesky";
import AskPostToastContent from "~components/ToastContent/AskPostToastContent";
import PostCompleteToastContent from "~components/ToastContent/PostComplateToastContent";
import { MessageFromBackgroundSchema } from "~types/MessageFromBackground";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*"],
};

const defaultToastOptions: ToastOptions = {
  autoClose: 2000,
  position: "bottom-right",
  type: "success",
  theme: "colored",
};

type RuntimeMessageListener = Parameters<
  typeof chrome.runtime.onMessage.addListener
>[0];

const ContentScriptUi: FC = () => {
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
          sendRequestPostToBluesky(message.tweetId)
            .then(() => {
              toast.update(toastId, {
                render: () => <PostCompleteToastContent />,
                ...defaultToastOptions,
              });
            })
            .catch((e) => {
              console.error(e);
            });
        };

        const toastId = toast(
          () => <AskPostToastContent onRequestPost={onRequestPost} />,
          { ...defaultToastOptions },
        );
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
