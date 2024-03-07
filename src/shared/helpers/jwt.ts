import type { JwtPayload } from "jwt-decode";

export const isTokenExpired = (payload: JwtPayload) => {
  const exp = payload.exp;
  if (exp === undefined) {
    // no expiration date
    return false;
  }

  const expirationDate = new Date(exp * 1000);
  const now = new Date();
  return expirationDate < now;
};
