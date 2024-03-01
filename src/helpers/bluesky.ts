import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyRichtextFacet,
  BskyAgent,
  RichText,
  type AtpPersistSessionHandler,
} from "@atproto/api";
import { jwtDecode } from "jwt-decode";

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

let cachedAgent: BskyAgent | null = null;
const logPrefix = "[bsky agent]";

const persistSessionHandler: AtpPersistSessionHandler = async (event, data) => {
  const accessTokenPayload = data && jwtDecode(data.accessJwt);
  const refreshTokenPayload = data && jwtDecode(data.refreshJwt);

  const accessExpiresAt =
    accessTokenPayload?.exp && new Date(accessTokenPayload.exp * 1000);
  const refreshExpiresAt =
    refreshTokenPayload?.exp && new Date(refreshTokenPayload.exp * 1000);

  console.log(`${logPrefix} session-event:${event},`, {
    ["access:expiresAt"]: accessExpiresAt?.toLocaleString(),
    ["refresh:tokenId"]: refreshTokenPayload?.jti,
    ["refresh:expiresAt"]: refreshExpiresAt?.toLocaleString(),
  });

  if (!data) {
    console.log(`${logPrefix} no session data. logout from bluesky.`);
    await logoutFromBluesky();
    return;
  }

  // replace with new access/refresh token.
  // refresh token stored in bluesky's backend is rotated after using once.
  // bluesky's `token rotation` is to update refresh token's validity period (expiresAt) to grace period (2 hours) and delete expired refresh token.
  // https://github.com/bluesky-social/atproto/blob/%40atproto/pds%400.4.3/packages/pds/src/account-manager/index.ts#L177
  await saveBskySession(data);
};

const getBskyAgent = async () => {
  cachedAgent ??= new BskyAgent({
    service: BLUESKY_SERVICE,
    persistSession: persistSessionHandler,
  });

  if (!cachedAgent.session) {
    const session = await getBskySession();
    if (session) {
      await cachedAgent.resumeSession(session);
      console.log(`${logPrefix} session is resumed.`);
    }
  }

  return cachedAgent;
};

const clearBskyAgent = () => {
  cachedAgent = null;
};

export const loginToBluesky = async (identifier: string, password: string) => {
  const agent = await getBskyAgent();
  const {
    data: { did },
  } = await agent.login({ identifier, password });
  const { data: profile } = await agent.getProfile({ actor: did });

  await Promise.all([
    saveBskySession(agent.session!), // session can NOT be undefined, since login and getProfile are successfully.
    saveBskyProfile(profile),
  ]);
  console.log(`${logPrefix} login to bluesky is successfully.`);

  return profile;
};

export const logoutFromBluesky = async () => {
  clearBskyAgent();
  await Promise.all([removeBskySession(), removeBskyProfile()]);

  console.log(`${logPrefix} logged-out from bluesky.`);
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
  images?: BlueskyEmbedImage[] | undefined,
) => {
  const agent = await getBskyAgent();
  const postRecord = await createPostRecord(agent, text);

  if (images && 1 <= images.length) {
    const uploadedImages: AppBskyEmbedImages.Image[] = [];

    const promises = images.map(async ({ alt, mediaType, base64 }) => {
      const result = await agent.uploadBlob(base64ToBinary(base64), {
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
          const result = await agent.uploadBlob(new Uint8Array(arrayBuffer), {
            encoding: contentType ?? "image/jpg",
          });
          external.thumb = result.data.blob;
        }

        postRecord.embed = {
          $type: "app.bsky.embed.external",
          external,
        };
      }
    }
  }

  return agent.post(postRecord);
};
