import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyRichtextFacet,
  BskyAgent,
  RichText,
} from "@atproto/api";

import { BLUESKY_SERVICE } from "~constants";
import {
  getBskySession,
  removeBskyProfile,
  removeBskySession,
  saveBskyProfile,
  saveBskySession,
} from "~helpers/storage";
import { getPreview } from "~helpers/twitter";
import { base64ToBinary } from "~helpers/utils";

export type ProfileViewDetailed = Awaited<
  ReturnType<InstanceType<typeof BskyAgent>["getProfile"]>
>["data"];

// chrome の(型の)バグ？ (https://zwzw.hatenablog.com/entry/2019/12/04/200000)
// Promise ではなく true を返さないと sendResponse の内容が background で受信できない (https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)
export type RuntimeMessageListener = (
  ...args: Parameters<
    Parameters<typeof chrome.runtime.onMessage.addListener>[0]
  >
) => true | void;

type PostRecord = Parameters<InstanceType<typeof BskyAgent>["post"]>[0];

let bskyAgent: BskyAgent | null = null;

const createBskyAgent = () => {
  return new BskyAgent({
    service: BLUESKY_SERVICE,
    persistSession: async (event, data) => {
      console.log("[bsky agent]", `session:${event}`, data);

      if (event === "expired") {
        await logoutFromBluesky();
      }
    },
  });
};

export const loginToBluesky = async (identifier: string, password: string) => {
  bskyAgent = createBskyAgent();
  const { data } = await bskyAgent.login({ identifier, password });

  if (!bskyAgent.session) {
    bskyAgent = null;
    throw new Error(
      "login to bluesky was successful, but the agent has no session",
    );
  }

  const { data: profile } = await bskyAgent.getProfile({ actor: data.did });

  await Promise.all([
    saveBskySession(bskyAgent.session),
    saveBskyProfile(profile),
  ]);

  return profile;
};

export const logoutFromBluesky = async () => {
  bskyAgent = null;

  await Promise.all([removeBskySession(), removeBskyProfile()]);
};

const createPostRecord = async (bskyAgent: BskyAgent, text: string) => {
  const postRecord: PostRecord = { text };

  const richText = new RichText({ text });
  await richText.detectFacets(bskyAgent);
  if (richText.facets) {
    postRecord.facets = richText.facets;
  }

  return postRecord;
};

export interface BlueskyEmbedImage {
  alt: string;
  base64: string;
  mediaType: string;
}

export const postToBluesky = async (
  text: string,
  embed?: {
    images?: BlueskyEmbedImage[] | undefined;
  },
) => {
  if (!bskyAgent) {
    const session = await getBskySession();
    if (!session) {
      throw new Error("no session data is in storage.");
    }
    bskyAgent = createBskyAgent();
    await bskyAgent.resumeSession(session);
  }

  const postRecord = await createPostRecord(bskyAgent, text);

  if (embed?.images) {
    const uploadedImages: AppBskyEmbedImages.Image[] = [];

    const promises = embed.images.map(async ({ alt, mediaType, base64 }) => {
      const result = await bskyAgent?.uploadBlob(base64ToBinary(base64), {
        encoding: mediaType,
      });
      if (result?.success) {
        const image = result.data.blob;
        uploadedImages.push({ alt, image });
      }
    });
    await Promise.all(promises);

    postRecord.embed = {
      $type: "app.bsky.embed.images",
      images: uploadedImages,
    };
  } else {
    const links = postRecord.facets?.flatMap((facet) => {
      return facet.features.filter(AppBskyRichtextFacet.isLink);
    });
    const [firstLink] = links ?? [];

    if (firstLink) {
      const preview = getPreview(firstLink.uri);

      if (preview) {
        const external: AppBskyEmbedExternal.External = {
          uri: firstLink.uri,
          title: preview.title,
          description: preview.description,
        };

        if (preview.imageUrl) {
          const [contentType, arrayBuffer] = await fetch(preview.imageUrl).then(
            async (res) => {
              return [
                res.headers.get("Content-Type"),
                await res.arrayBuffer(),
              ] as const;
            },
          );
          const result = await bskyAgent.uploadBlob(
            new Uint8Array(arrayBuffer),
            {
              encoding: contentType ?? "image/jpg",
            },
          );
          external.thumb = result.data.blob;
        }

        postRecord.embed = {
          $type: "app.bsky.embed.external",
          external,
        };
      }
    }
  }

  return bskyAgent.post(postRecord);
};
