import { ChakraProvider } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import reactToastifyStyle from "data-text:react-toastify/dist/ReactToastify.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, type FC } from "react";
import { toast, ToastContainer, type ToastOptions } from "react-toastify";

import { sendRequestPostToBluesky } from "~background/messages/requestPostToBluesky";
import AskPostToastContent from "~components/ToastContent/AskPostToastContent";
import PostCompleteToastContent from "~components/ToastContent/PostComplateToastContent";
import { onAskPostToBlueskyMessage } from "~contents/messages/askPostToBluesky";

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
    const unsubscribe = onAskPostToBlueskyMessage((message) => {
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
    });

    return () => {
      unsubscribe();
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
