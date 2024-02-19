import { ChakraProvider } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider, css, Global } from "@emotion/react";
import reactToastifyStyle from "data-text:react-toastify/dist/ReactToastify.css";
import type { PlasmoCSConfig, PlasmoCSUIProps, PlasmoGetStyle } from "plasmo";
import { useEffect, type FC } from "react";
import {
  toast,
  ToastContainer,
  type ToastOptions,
  type UpdateOptions,
} from "react-toastify";

import { sendPostToBluesky } from "~background/messages/postToBluesky";
import AskPostToastContent from "~components/ToastContent/AskPostToastContent";
import { onAskPostToBluesky } from "~contents/messages/askPostToBluesky";

const defaultToastOptions: ToastOptions = {
  position: "bottom-right",
  theme: "colored",
  icon: false,
};

const styleElement = document.createElement("style");

const styleCache = createCache({
  key: "plasmo-emotion-cache",
  container: styleElement,
});

const globalStyles = css`
  ${reactToastifyStyle.replace(":root", ":host")}
  :host {
    --toastify-color-success: rgb(0, 112, 255);
  }
`;

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*"],
};

export const getStyle: PlasmoGetStyle = () => {
  return styleElement;
};

const ContentScriptUi: FC<PlasmoCSUIProps> = () => {
  useEffect(() => {
    const unsubscribe = onAskPostToBluesky(({ tweetId, tweetText }) => {
      const onRequestPost = async () => {
        toast.update(toastId, { autoClose: false });

        const response = await sendPostToBluesky(tweetId).catch((e) => ({
          isSuccess: false,
          errorMessage: e instanceof Error ? e.message : "error",
        }));

        const toastOptions: UpdateOptions = {
          ...defaultToastOptions,
          ...(response.isSuccess
            ? {
                render: () => "送信完了 🦋",
                type: "success",
                autoClose: 1000,
              }
            : {
                render: () => response.errorMessage,
                type: "error",
                autoClose: false,
              }),
        };
        toast.update(toastId, toastOptions);
      };

      toast.dismiss(); // clear all
      const toastId = toast(
        () => (
          <AskPostToastContent
            tweetText={tweetText}
            onRequestPost={onRequestPost}
          />
        ),
        {
          ...defaultToastOptions,
          type: "success",
          autoClose: false,
        },
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <CacheProvider value={styleCache}>
      <Global styles={globalStyles} />
      <ChakraProvider>
        <ToastContainer limit={1} />
      </ChakraProvider>
    </CacheProvider>
  );
};

export default ContentScriptUi;
