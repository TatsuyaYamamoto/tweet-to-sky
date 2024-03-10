import imageCompression from "browser-image-compression";

export const base64ToBinary = (base64: string) => {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

export const arrayBufferToBase64 = (arrayBuffer: ArrayBuffer) => {
  // https://stackoverflow.com/a/9458996
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

export const compressImage = async (
  input: Uint8Array,
  mediaType: string,
  maxSizeMib: number, // https://github.com/Donaldcwl/browser-image-compression/blob/master/lib/image-compression.js#L51
): Promise<Uint8Array> => {
  const rawFile = new File([input.buffer], "image", {
    type: mediaType,
  });
  const compressedFile = await imageCompression(rawFile, {
    maxSizeMB: maxSizeMib,
  });
  return new Uint8Array(await compressedFile.arrayBuffer());
};
