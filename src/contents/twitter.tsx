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
import { useEnsureMedia } from "~contents/hooks/useEnsureMedia";
import { onAskPostToBluesky } from "~contents/messages/askPostToBluesky";
import { arrayBufferToBase64 } from "~helpers/utils";

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
  const { getEnsuredMediaEntries, clearEnsuredMedia } = useEnsureMedia();

  useEffect(() => {
    const handler: Parameters<typeof onAskPostToBluesky>[0] = ({
      tweetId,
      tweetText,
      mediaIds: tweetMediaIds,
    }) => {
      const onRequestPost = async () => {
        toast.update(toastId, { autoClose: false });

        const postTargetMedias = getEnsuredMediaEntries().flatMap(
          ([ensuredMediaId, ensuredMedia]) => {
            if (!tweetMediaIds.includes(ensuredMediaId)) {
              return [];
            }

            const { alt, arrayBuffer, mediaType } = ensuredMedia;
            return [
              {
                mediaId: ensuredMediaId,
                alt,
                base64: arrayBufferToBase64(arrayBuffer),
                mediaType,
              },
            ];
          },
        );
        clearEnsuredMedia();

        const response = await sendPostToBluesky(
          tweetId,
          postTargetMedias,
        ).catch((e) => ({
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
    };

    const unsubscribe = onAskPostToBluesky(handler);
    return () => {
      unsubscribe();
    };
  }, [getEnsuredMediaEntries, clearEnsuredMedia]);

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
