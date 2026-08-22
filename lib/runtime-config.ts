type RuntimeConfig = { alchemyKey: string | null };

// Route handlers can be bundled independently by Next.js. Keeping the
// override on globalThis and process.env lets an admin save apply to the
// snapshot and status handlers within the same running server instance.
const runtimeConfig = globalThis as typeof globalThis & { __bluesuiteRuntimeConfig?: RuntimeConfig };

/**
 * Environment configuration remains the durable source of truth. The runtime
 * override lets an authenticated operator apply a key immediately without
 * exposing it to the browser or requiring a rebuild.
 */
export function getAlchemyApiKey() {
  return runtimeConfig.__bluesuiteRuntimeConfig?.alchemyKey ?? process.env.ALCHEMY_API_KEY ?? "";
}

export function setAlchemyApiKey(value: string) {
  const trimmed = value.trim();
  runtimeConfig.__bluesuiteRuntimeConfig = { alchemyKey: trimmed || null };
  if (trimmed) process.env.ALCHEMY_API_KEY = trimmed;
  return Boolean(getAlchemyApiKey());
}

export function hasAlchemyApiKey() {
  return Boolean(getAlchemyApiKey());
}
