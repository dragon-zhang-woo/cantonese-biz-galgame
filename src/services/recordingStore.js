export const AUDIO_DB_NAME = "cantonese-biz-audio-v1";
const STORE_NAME = "recordings";
const AUDIO_DB_VERSION = 1;
const MAX_RECORDINGS = 20;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function asPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDatabase(indexedDB = globalThis.indexedDB) {
  if (!indexedDB) return Promise.reject(new Error("indexeddb_unavailable"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AUDIO_DB_NAME, AUDIO_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(indexedDB, mode, operation) {
  const database = await openDatabase(indexedDB);
  try {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = await operation(store);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    return result;
  } finally {
    database.close();
  }
}

function sanitizeAsset(asset, now = new Date()) {
  const createdAt = new Date(asset.createdAt || now).toISOString();
  const expiresAt = new Date(
    asset.expiresAt || new Date(createdAt).getTime() + RETENTION_MS,
  ).toISOString();
  return {
    id: String(asset.id),
    origin: asset.origin === "uploaded" ? "uploaded" : "recorded",
    scope: String(asset.scope),
    blob: asset.blob,
    mimeType: String(asset.mimeType || asset.blob?.type || "application/octet-stream"),
    size: Number(asset.size ?? asset.blob?.size ?? 0),
    durationMs: Math.max(0, Math.round(Number(asset.durationMs) || 0)),
    createdAt,
    expiresAt,
    displayName: String(asset.displayName || "训练录音").slice(0, 80),
  };
}

export async function pruneAudioAssets({
  indexedDB = globalThis.indexedDB,
  now = new Date(),
} = {}) {
  const nowMs = now.getTime();
  return withStore(indexedDB, "readwrite", async (store) => {
    const assets = await asPromise(store.getAll());
    const active = assets
      .filter((asset) => new Date(asset.expiresAt).getTime() > nowMs)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const keepIds = new Set(active.slice(0, MAX_RECORDINGS).map((asset) => asset.id));
    const removals = assets.filter((asset) => !keepIds.has(asset.id));
    await Promise.all(removals.map((asset) => asPromise(store.delete(asset.id))));
    return active.slice(0, MAX_RECORDINGS);
  });
}

export async function saveAudioAsset(
  asset,
  { indexedDB = globalThis.indexedDB, now = new Date() } = {},
) {
  const safeAsset = sanitizeAsset(asset, now);
  await withStore(indexedDB, "readwrite", (store) => asPromise(store.put(safeAsset)));
  await pruneAudioAssets({ indexedDB, now });
  return safeAsset;
}

export async function listAudioAssets({
  indexedDB = globalThis.indexedDB,
  now = new Date(),
} = {}) {
  await pruneAudioAssets({ indexedDB, now });
  return withStore(indexedDB, "readonly", async (store) => {
    const assets = await asPromise(store.getAll());
    return assets.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  });
}

export async function deleteAudioAsset(id, indexedDB = globalThis.indexedDB) {
  return withStore(indexedDB, "readwrite", (store) => asPromise(store.delete(id)));
}

export async function clearAudioAssets(indexedDB = globalThis.indexedDB) {
  if (!indexedDB) return;
  return withStore(indexedDB, "readwrite", (store) => asPromise(store.clear()));
}
