import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

/**
 * OpenNext Cloudflare caching (small site + revalidation).
 * Requires wrangler bindings: NEXT_INC_CACHE_R2_BUCKET, NEXT_CACHE_DO_QUEUE,
 * NEXT_TAG_CACHE_D1, WORKER_SELF_REFERENCE.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
    bypassTagCacheOnCacheHit: true,
  }),
  queue: doQueue,
  tagCache: d1NextTagCache,
});
