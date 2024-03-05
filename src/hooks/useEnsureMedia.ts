import { md5 as toMd5 } from "js-md5";
import { useCallback, useEffect, useRef } from "react";

import { onEnsureMedia } from "~contents/messages/ensureMedia";
import { arrayBufferToBase64 } from "~helpers/utils";

const getTweetImages = () => {
  return Array.from(document.body.querySelectorAll("img"))
    .filter((img) => img.src.startsWith("blob:"))
    .map((img) => ({
      alt: img.alt,
      url: img.src,
    }));
};

interface EnsuredMedia {
  alt: string;
  arrayBuffer: ArrayBuffer;
  base64: string;
  mediaType: string;
}

export const useEnsureMedia = () => {
  const ensuredMediaMapRef = useRef<Map<string /* mediaId */, EnsuredMedia>>(
    new Map(),
  );

  useEffect(() => {
    const unsubscribe = onEnsureMedia((message) => {
      const { mediaId, md5, mediaType } = message;
      const tweetImages = getTweetImages();

      Promise.all(
        tweetImages.map(async ({ alt, url }) => {
          const arrayBuffer = await fetch(url).then((res) => res.arrayBuffer());
          return { alt, arrayBuffer };
        }),
      )
        .then((images) => {
          const image = images.find(({ arrayBuffer }) => {
            return md5 === toMd5(arrayBuffer);
          });
          if (image) {
            ensuredMediaMapRef.current.set(mediaId, {
              ...image,
              base64: arrayBufferToBase64(image.arrayBuffer),
              mediaType,
            });
          }
        })
        .catch((e) => {
          console.error(e);
        });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getEnsuredMedias = useCallback((mediaIds: string[]) => {
    return mediaIds.map((mediaId) => {
      return ensuredMediaMapRef.current.get(mediaId);
    });
  }, []);

  const clearEnsuredMedia = useCallback((mediaIds: string[]) => {
    mediaIds.map((mediaId) => {
      ensuredMediaMapRef.current.delete(mediaId);
    });
  }, []);

  return { getEnsuredMedias, clearEnsuredMedia };
};
