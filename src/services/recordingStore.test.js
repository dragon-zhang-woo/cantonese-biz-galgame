import { afterEach, describe, expect, it } from "vitest";
import { indexedDB } from "fake-indexeddb";
import {
  AUDIO_DB_NAME,
  clearAudioAssets,
  deleteAudioAsset,
  listAudioAssets,
  saveAudioAsset,
} from "./recordingStore.js";

afterEach(async () => {
  await clearAudioAssets(indexedDB);
  indexedDB.deleteDatabase(AUDIO_DB_NAME);
});

describe("recording store", () => {
  it("keeps only the newest 20 anonymous recordings within 30 days", async () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    for (let index = 0; index < 22; index += 1) {
      const createdAt = new Date(now.getTime() - index * 60_000).toISOString();
      await saveAudioAsset(
        {
          id: `asset-${index}`,
          origin: "recorded",
          scope: "custom-turn",
          blob: new Blob([`audio-${index}`], { type: "audio/webm" }),
          mimeType: "audio/webm",
          size: 7,
          durationMs: 1000,
          createdAt,
          expiresAt: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
          displayName: `训练录音 ${index}`,
          transcript: "must never persist",
          originalFileName: "private-client-name.webm",
        },
        { indexedDB, now },
      );
    }

    const assets = await listAudioAssets({ indexedDB, now });

    expect(assets).toHaveLength(20);
    expect(assets[0].id).toBe("asset-0");
    expect(assets.at(-1).id).toBe("asset-19");
    expect(assets[0]).not.toHaveProperty("transcript");
    expect(assets[0]).not.toHaveProperty("originalFileName");
  });

  it("prunes expired recordings and supports one-item and full deletion", async () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    const makeAsset = (id, expiresAt) => ({
      id,
      origin: "uploaded",
      scope: "scenario-intake",
      blob: new Blob([id], { type: "audio/mp4" }),
      mimeType: "audio/mp4",
      size: id.length,
      durationMs: 2000,
      createdAt: new Date(now.getTime() - 1000).toISOString(),
      expiresAt,
      displayName: `现实情境 ${id}`,
    });
    await saveAudioAsset(
      makeAsset("expired", new Date(now.getTime() - 1).toISOString()),
      { indexedDB, now },
    );
    await saveAudioAsset(
      makeAsset("active", new Date(now.getTime() + 60_000).toISOString()),
      { indexedDB, now },
    );

    expect((await listAudioAssets({ indexedDB, now })).map((asset) => asset.id)).toEqual([
      "active",
    ]);
    await deleteAudioAsset("active", indexedDB);
    expect(await listAudioAssets({ indexedDB, now })).toEqual([]);

    await saveAudioAsset(
      makeAsset("again", new Date(now.getTime() + 60_000).toISOString()),
      { indexedDB, now },
    );
    await clearAudioAssets(indexedDB);
    expect(await listAudioAssets({ indexedDB, now })).toEqual([]);
  });
});
