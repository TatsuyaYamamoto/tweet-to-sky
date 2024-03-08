import { jwtDecode } from "jwt-decode";

export const decodeBlueskyJwt = (token: string) => {
  const payload = jwtDecode(token);

  if (payload.exp === undefined) {
    throw new Error(`unexpected token payload. token has no "exp"`);
  }

  return {
    jwtId: payload.jti,
    expirationDate: new Date(payload.exp * 1000),
  };
};

export const isTokenExpired = (token: string) => {
  const payload = decodeBlueskyJwt(token);
  const now = new Date();
  return payload.expirationDate < now;
};
