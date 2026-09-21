import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Minimal Cloudflare OpenNext config (no R2 — enable R2 in the dashboard
 * to restore r2-incremental-cache + DO queue later).
 */
export default defineCloudflareConfig({
  incrementalCache: "dummy",
  tagCache: "dummy",
  queue: "dummy",
});
