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
