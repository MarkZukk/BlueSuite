import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "bluesuite_admin";
const SESSION_HOURS = 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function configured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret());
}

export function passwordMatches(candidate: string) {
  const expected = Buffer.from(process.env.ADMIN_PASSWORD || "");
  const actual = Buffer.from(candidate);
  return expected.length > 0 && expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_HOURS * 60 * 60;
  const payload = String(expires);
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySession(value?: string | null) {
  if (!value || !secret()) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", secret()).update(expires).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
