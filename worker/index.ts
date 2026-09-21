export interface Env {
  ASSETS: Fetcher
  APP_ENV: string
  // Add bindings for runtime vars/secrets here as you configure them, e.g.:
  // API_PROXY_TARGET: string
}

export default {
  async fetch(request, env): Promise<Response> {
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
