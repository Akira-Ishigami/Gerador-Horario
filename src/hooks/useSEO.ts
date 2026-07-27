import { useEffect } from "react"
import { APP_NAME, APP_DOMAIN } from "@/config/branding"

interface SEOOptions {
  title: string
  description: string
  path?: string
  noIndex?: boolean
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

/**
 * Aplica title/description/OG/canonical por página numa SPA.
 * Simples de propósito (sem lib extra) — cobre o essencial para SEO
 * enquanto o app não migra para um framework com SSR.
 */
export function useSEO({ title, description, path = "/", noIndex = false }: SEOOptions) {
  useEffect(() => {
    const fullTitle = title === APP_NAME ? title : `${title} · ${APP_NAME}`
    document.title = fullTitle

    setMeta("name", "description", description)
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow")
    setMeta("property", "og:title", fullTitle)
    setMeta("property", "og:description", description)
    setMeta("property", "og:type", "website")
    setMeta("property", "og:url", `https://${APP_DOMAIN}${path}`)
    setMeta("name", "twitter:card", "summary_large_image")
    setMeta("name", "twitter:title", fullTitle)
    setMeta("name", "twitter:description", description)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.setAttribute("rel", "canonical")
      document.head.appendChild(canonical)
    }
    canonical.setAttribute("href", `https://${APP_DOMAIN}${path}`)
  }, [title, description, path, noIndex])
}
