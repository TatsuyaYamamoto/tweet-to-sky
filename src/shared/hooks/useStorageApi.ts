import { useStorage } from "@plasmohq/storage/hook";

import {
  localAreaStorage,
  type StorageKey,
  type StorageKeyValue,
} from "~shared/helpers/storage";

export const useStorageApi = <
  Key extends StorageKey,
  Value extends StorageKeyValue[Key],
>(
  key: Key,
) => {
  return useStorage<Value>({
    key,
    instance: localAreaStorage,
  });
};
