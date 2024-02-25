import { md5 as toMd5 } from "js-md5";
import { useCallback, useEffect, useRef } from "react";

import { onEnsureMedia } from "~contents/messages/ensureMedia";

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

  const getEnsuredMediaEntries = useCallback(() => {
    return Array.from(ensuredMediaMapRef.current.entries());
  }, []);

  const clearEnsuredMedia = useCallback(() => {
    ensuredMediaMapRef.current.clear();
  }, []);

  return { getEnsuredMediaEntries, clearEnsuredMedia };
};
