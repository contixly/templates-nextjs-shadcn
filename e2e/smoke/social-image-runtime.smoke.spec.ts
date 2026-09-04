import type { APIResponse } from "@playwright/test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "../support/test";

const expectPng = async (response: APIResponse) => {
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");

  const body = await response.body();

  expect(body.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(body.readUInt32BE(16)).toBe(1200);
  expect(body.readUInt32BE(20)).toBe(630);
};

test("keeps social image generation available after an image optimizer cache miss", async ({
  request,
}) => {
  const probeId = crypto.randomUUID();

  rmSync(join(process.cwd(), ".next/cache/images"), { recursive: true, force: true });

  await expectPng(
    await request.get(`/docs/og/index?locale=en&probe=before-${probeId}`, {
      headers: { "user-agent": "Twitterbot/1.0" },
    })
  );

  const sourceUrl = "/img/branding/template_logo_nb_s.png";
  const optimizerResponse = await request.get(
    `/_next/image?url=${encodeURIComponent(sourceUrl)}&w=384&q=75`
  );

  expect(optimizerResponse.status()).toBe(200);
  expect(optimizerResponse.headers()["x-nextjs-cache"]).toBe("MISS");

  await expectPng(
    await request.get(`/docs/og/index?locale=en&probe=after-${probeId}`, {
      headers: { "user-agent": "Twitterbot/1.0" },
    })
  );
});
