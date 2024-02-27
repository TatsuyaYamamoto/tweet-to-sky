import { z } from "zod";

import { savePreview } from "~helpers/twitter";

const StringValue = z.object({
  type: z.literal("STRING"),
  string_value: z.string(),
});

const ImageValue = z.object({
  type: z.literal("IMAGE"),
  image_value: z.object({
    url: z.string(),
    width: z.number(),
    height: z.number(),
  }),
});

export const PreviewCardApiResponseSchema = z.object({
  card: z.object({
    url: z.string(),
    binding_values: z.object({
      card_url: StringValue,
      description: StringValue,
      photo_image_full_size_original: ImageValue.optional(),
      title: StringValue,
    }),
  }),
  result: z.literal("CARD_FOUND"),
});

chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    const { method, url: rawUrl, requestHeaders, initiator } = details;

    if (!initiator?.startsWith("https://twitter.com")) {
      // API Calling in this lister should be ignored
      return;
    }

    if (method === "OPTIONS") {
      // preflight should be ignored
      return;
    }

    // https://caps.twitter.com/v2/cards/preview.json?status=https%3A%2F%2Fidolypride.jp%2F&cards_platform=Web-12&include_cards=true
    const url = new URL(rawUrl);
    const previewTargetUrl = url.searchParams.get("status");

    if (!previewTargetUrl) {
      return;
    }

    const requestHeaderMap = Object.fromEntries(
      requestHeaders?.flatMap(({ name, value }) =>
        value ? [[name, value]] : [],
      ) ?? [],
    );

    fetch(rawUrl, { method, headers: requestHeaderMap })
      .then((res) => res.json())
      .then((json) => {
        const parseResult = PreviewCardApiResponseSchema.safeParse(json);
        if (!parseResult.success) {
          return;
        }

        const {
          card: {
            binding_values: {
              title: { string_value: title },
              description: { string_value: description },
              photo_image_full_size_original,
            },
          },
        } = parseResult.data;
        const imageUrl = photo_image_full_size_original?.image_value.url;

        savePreview(previewTargetUrl, { title, description, imageUrl });
      })
      .catch((e) => {
        console.error(e);
      });
  },
  {
    urls: ["https://caps.twitter.com/v2/cards/preview.json?*"],
    types: ["xmlhttprequest"],
  },
  ["requestHeaders"],
);
