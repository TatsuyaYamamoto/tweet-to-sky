import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyRichtextFacet,
  BskyAgent,
  RichText,
  type AtpPersistSessionHandler,
} from "@atproto/api";

import { decodeBlueskyJwt } from "~shared/helpers/jwt";
import {
  getStorageValue,
  removeStorageValue,
  setStorageValue,
} from "~shared/helpers/storage";
import { getPreview } from "~shared/helpers/twitter";
import { base64ToBinary, compressImage } from "~shared/helpers/utils";

export type ProfileViewDetailed = Awaited<
  ReturnType<InstanceType<typeof BskyAgent>["getProfile"]>
>["data"];

type PostRecord = Parameters<InstanceType<typeof BskyAgent>["post"]>[0];

let cachedAgent: BskyAgent | null = null;

const logPrefix = "[bsky agent]";

const BLUESKY_SERVICE = "https://bsky.social";

/**
 * https://docs.bsky.app/docs/advanced-guides/posts#images-embeds
 */
const MAX_BLUESKY_IMAGE_FILE_SIZE_MIB =
  /* (max bytes with buffer) / kib / mib */
  (1000000 * 0.99) / 1024 / 1024;

const persistSessionHandler: AtpPersistSessionHandler = async (event, data) => {
  const accessToken = data && decodeBlueskyJwt(data.accessJwt);
  const refreshToken = data && decodeBlueskyJwt(data.refreshJwt);

  console.log(`${logPrefix} session-event:${event},`, {
    ["access:expiresAt"]: accessToken?.toLocaleString(),
    ["refresh:jwtId"]: refreshToken?.jwtId,
    ["refresh:expiresAt"]: refreshToken?.toLocaleString(),
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
  await setStorageValue("bluesky:session", data);
};

const getBskyAgent = async () => {
  cachedAgent ??= new BskyAgent({
    service: BLUESKY_SERVICE,
    persistSession: persistSessionHandler,
  });

  if (!cachedAgent.session) {
    const session = await getStorageValue("bluesky:session");
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
    setStorageValue("bluesky:session", agent.session!), // session can NOT be undefined, since login and getProfile are successfully.
    setStorageValue("bluesky:profile", profile),
  ]);
  console.log(`${logPrefix} login to bluesky is successfully.`);

  return profile;
};

export const logoutFromBluesky = async () => {
  clearBskyAgent();
  await Promise.all([
    removeStorageValue("bluesky:session"),
    removeStorageValue("bluesky:profile"),
  ]);

  console.log(`${logPrefix} logged-out from bluesky.`);
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

  const postRecord: PostRecord = { text };

  const richText = new RichText({ text });
  await richText.detectFacets(agent);
  if (richText.facets) {
    postRecord.facets = richText.facets;
  }

  if (images && 1 <= images.length) {
    // priority #1
    // If a tweet has images, embed images as a blob
    // https://docs.bsky.app/docs/advanced-guides/posts#images-embeds

    if (4 < images.length) {
      throw new Error(
        `${logPrefix} bluesky allows to embed max 4 images. ${images.length} images are provided.`,
      );
    }

    const uploadedImages: AppBskyEmbedImages.Image[] = await Promise.all(
      images.map(async ({ alt, mediaType, base64 }) => {
        const compressed = await compressImage(
          base64ToBinary(base64),
          mediaType,
          MAX_BLUESKY_IMAGE_FILE_SIZE_MIB,
        );
        const result = await agent.uploadBlob(compressed, {
          encoding: mediaType,
        });
        return { alt, image: result.data.blob };
      }),
    );

    postRecord.embed = {
      $type: "app.bsky.embed.images",
      images: uploadedImages,
    };
  } else {
    // priority #2
    // If tweet has links, embed a "first" link as a website card
    // https://docs.bsky.app/docs/advanced-guides/posts#website-card-embeds

    const links = postRecord.facets?.flatMap((facet) => {
      return facet.features.filter(AppBskyRichtextFacet.isLink);
    });
    const [firstLink] = links ?? [];

    if (firstLink) {
      const linkedSiteData = getPreview(firstLink.uri);

      if (linkedSiteData) {
        const external: AppBskyEmbedExternal.External = {
          uri: firstLink.uri,
          title: linkedSiteData.title,
          description: linkedSiteData.description,
        };

        if (linkedSiteData.imageUrl) {
          try {
            const fetchRes = await fetch(linkedSiteData.imageUrl);
            const apiOptions = [
              new Uint8Array(await fetchRes.arrayBuffer()),
              {
                encoding: fetchRes.headers.get("Content-Type") ?? "image/jpg", // no basis fallback value...
              },
            ] as const;
            const {
              data: { blob },
            } = await agent.uploadBlob(...apiOptions);
            external.thumb = blob;
          } catch (e) {
            console.error(
              `${logPrefix} failed to load a linked site's image, but continue post process.`,
              e,
            );
          }
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

export const getProfileUrl = (handle: string) => {
  return `https://bsky.app/profile/${handle}`;
};
