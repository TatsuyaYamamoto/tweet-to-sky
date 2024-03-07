const tweetMap: Record<string, string> = {};
const previewMap: Record<string /* url */, TwitterPreviewCard> = {};

interface TwitterPreviewCard {
  title: string;
  description: string;
  imageUrl?: string | undefined;
}

export const saveTweetText = (tweetText: string) => {
  const tweetId = crypto.randomUUID();
  tweetMap[tweetId] = tweetText;
  return tweetId;
};

export const restoreTweetText = (tweetId: string) => {
  const tweetText = tweetMap[tweetId];
  delete tweetMap[tweetId];
  return tweetText;
};

export const savePreview = (url: string, preview: TwitterPreviewCard) => {
  previewMap[url] = preview;
};

export const getPreview = (url: string): TwitterPreviewCard | undefined => {
  return previewMap[url];
};
