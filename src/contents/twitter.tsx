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
import { useBluesky } from "~hooks/useBluesky";
import { useEnsureMedia } from "~hooks/useEnsureMedia";

const defaultToastOptions: ToastOptions = {
  position: "bottom-right",
  icon: false,
  autoClose: false,
  closeButton: false,
};

const styleElement = document.createElement("style");

const styleCache = createCache({
  key: "plasmo-emotion-cache",
  container: styleElement,
});

const globalStyles = css`
  ${reactToastifyStyle.replace(":root", ":host")}
  :host {
    --color-bluesky-logo-blue-values: 0, 133, 255;
    --color-bluesky-logo-blue: rgb(var(--color-bluesky-logo-blue-values));
    --color-bluesky-button-gradation-from: rgb(90, 113, 250);
    --color-bluesky-button-gradation-to: rgb(0, 133, 255);
    --color-bluesky-font-blue: rgb(16, 131, 254);

    --toastify-color-success: var(--color-bluesky-logo-blue);
  }

  .Toastify__toast {
    border: 1px solid rgba(var(--color-bluesky-logo-blue-values), 0.2);
  }

  .Toastify__toast-body {
    padding: 0;
  }
`;

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*"],
};

export const getStyle: PlasmoGetStyle = () => {
  return styleElement;
};

const ContentScriptUi: FC<PlasmoCSUIProps> = () => {
  const { profile, checkIsSessionAvailable } = useBluesky();
  const { getEnsuredMedias, clearEnsuredMedia } = useEnsureMedia();

  useEffect(() => {
    const handler: Parameters<typeof onAskPostToBluesky>[0] = ({
      tweetId,
      tweetText,
      mediaIds: tweetMediaIds,
    }) => {
      if (!checkIsSessionAvailable()) {
        return;
      }

      const onRequestPost = async () => {
        toast.update(toastId, { autoClose: false });

        const postTargetMedias = getEnsuredMedias(tweetMediaIds)
          // TODO Consider what to handle images that could not be ensured. ignore(as-is)? show error?
          .flatMap((value) => (value ? [value] : []));

        const postResult = await sendPostToBluesky(
          tweetId,
          postTargetMedias,
        ).catch((e) => ({
          isSuccess: false,
          errorMessage: e instanceof Error ? e.message : "error",
        }));

        clearEnsuredMedia(tweetMediaIds);

        const toastOptions: UpdateOptions = postResult.isSuccess
          ? {
              ...defaultToastOptions,
              render: () => "送信完了 🦋",
              type: "success",
              autoClose: 1000,
            }
          : {
              ...defaultToastOptions,
              render: () => postResult.errorMessage,
              type: "error",
              theme: "colored",
              autoClose: 3000,
            };

        toast.update(toastId, toastOptions);
      };

      toast.dismiss(); // clear all
      const toastId = toast(
        () => (
          <AskPostToastContent
            tweetText={tweetText}
            profileImageUrl={profile?.avatar}
            onRequestPost={onRequestPost}
            onClose={() => toast.dismiss()}
          />
        ),
        {
          ...defaultToastOptions,
        },
      );
    };

    const unsubscribe = onAskPostToBluesky(handler);
    return () => {
      unsubscribe();
    };
  }, [profile, getEnsuredMedias, clearEnsuredMedia, checkIsSessionAvailable]);

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
