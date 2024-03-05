/**
 * @fileOverview see https://docs.plasmo.com/framework/content-scripts-ui/styling#css-in-js
 */
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { type FC, type PropsWithChildren } from "react";

export const cacheStyleElement = document.createElement("style");

const styleCache = createCache({
  key: "plasmo-emotion-cache",
  container: cacheStyleElement,
});

const ContentScriptUiCacheProvider: FC<PropsWithChildren> = ({ children }) => {
  return <CacheProvider value={styleCache}>{children}</CacheProvider>;
};

export default ContentScriptUiCacheProvider;
