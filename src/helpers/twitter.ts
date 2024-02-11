const tweetMap: Record<string, string> = {};

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
