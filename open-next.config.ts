import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

/**
 * OpenNext caching without R2 (R2 not enabled on account yet).
 * KV incremental cache + D1 tag cache + DO revalidation queue.
 */
export default defineCloudflareConfig({
  // Do not bypass tag cache on regional hits — otherwise revalidateTag/revalidatePath
  // after creating events never updates /events until the regional TTL expires.
  incrementalCache: withRegionalCache(kvIncrementalCache, {
    mode: "long-lived",
    bypassTagCacheOnCacheHit: false,
  }),
  queue: doQueue,
  tagCache: d1NextTagCache,
});
