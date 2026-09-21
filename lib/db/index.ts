import { drizzle } from 'drizzle-orm/d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import * as schema from './schema'

export type AppDb = ReturnType<typeof drizzle<typeof schema>>

/**
 * D1 app database (Cloudflare Worker / OpenNext).
 * Requires wrangler binding `DB` → robonautsclub-app.
 */
export async function getDb(): Promise<AppDb> {
  const { env } = await getCloudflareContext({ async: true })
  const binding = (env as CloudflareEnv).DB
  if (!binding) {
    throw new Error(
      'D1 binding DB is missing. Add robonautsclub-app to wrangler.jsonc and run initOpenNextCloudflareForDev() for local Next.js.',
    )
  }
  return drizzle(binding, { schema })
}

export function getDbFromEnv(env: CloudflareEnv): AppDb {
  return drizzle(env.DB, { schema })
}

export * from './schema'
