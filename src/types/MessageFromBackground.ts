import { literal, object, string, union, type Output } from "valibot";

export const DetectTweetMessageSchema = object({
  type: literal("detectTweet"),
  value: string(),
});

export type DetectTweetMessage = Output<typeof DetectTweetMessageSchema>;

export const MessageFromBackgroundSchema = union([DetectTweetMessageSchema]);

export type MessageFromBackground = Output<typeof MessageFromBackgroundSchema>;
