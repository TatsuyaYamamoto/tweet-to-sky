import { ChakraProvider } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider, css, Global } from "@emotion/react";
import reactToastifyStyle from "data-text:react-toastify/dist/ReactToastify.css";
import type { PlasmoCSConfig, PlasmoCSUIProps, PlasmoGetStyle } from "plasmo";
import { useEffect, type FC } from "react";
import { toast, ToastContainer, type ToastOptions } from "react-toastify";

import { sendPostToBluesky } from "~background/messages/postToBluesky";
import AskPostToastContent from "~components/ToastContent/AskPostToastContent";
import PostCompleteToastContent from "~components/ToastContent/PostComplateToastContent";
import { onAskPostToBluesky } from "~contents/messages/askPostToBluesky";

const defaultToastOptions: ToastOptions = {
  position: "bottom-right",
  type: "success",
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

        try {
          await sendPostToBluesky(tweetId);
          toast.update(toastId, {
            render: () => <PostCompleteToastContent />,
            ...defaultToastOptions,
            autoClose: 1000,
          });
        } catch (e) {
          console.error(e);
        }
      };

      const toastId = toast(
        () => (
          <AskPostToastContent
            tweetText={tweetText}
            onRequestPost={onRequestPost}
          />
        ),
        { ...defaultToastOptions, autoClose: 2000 },
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
        <ToastContainer />
      </ChakraProvider>
    </CacheProvider>
  );
};

export default ContentScriptUi;
