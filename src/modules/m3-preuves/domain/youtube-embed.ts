/**
 * Domaine M3 — Extraction de l'identifiant d'une vidéo YouTube (DT-S25-02).
 *
 * Pourquoi ce module existe : `video_url` est une chaîne saisie à la main,
 * et la page publique la destine à l'attribut `src` d'une `<iframe>`.
 * Y recopier l'entrée telle quelle reviendrait à laisser n'importe quelle
 * origine — ou un `javascript:` — s'exécuter dans la page. On ne valide donc
 * pas « ça ressemble à YouTube » : on EXTRAIT un identifiant, et on
 * reconstruit nous-mêmes une URL d'embed dont l'origine est en dur.
 *
 * Tout ce qui n'est pas reconnu renvoie `null` — l'appelant n'affiche alors
 * simplement pas de lecteur. Pas de repli, pas d'affichage dégradé.
 */

/** Hôtes acceptés, en minuscules et sans `www.` (retiré avant comparaison). */
const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtu.be', 'youtube-nocookie.com'])

/** Un id YouTube fait 11 caractères dans l'alphabet base64url. */
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

/**
 * Renvoie l'identifiant de la vidéo, ou null si l'URL n'est pas une vidéo
 * YouTube exploitable.
 *
 * Formats reconnus :
 * - https://www.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/shorts/ID
 * - https://www.youtube.com/live/ID
 */
export function extractYouTubeId(rawUrl?: string | null): string | null {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    // Chaîne qui n'est pas une URL absolue : on ne devine pas de protocole.
    return null
  }

  // `javascript:`, `data:` et consorts sont écartés ici, avant toute autre
  // considération : c'est le protocole qui rend une URL dangereuse.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (!YOUTUBE_HOSTS.has(host)) return null

  // youtu.be/ID — l'identifiant est le chemin lui-même.
  if (host === 'youtu.be') {
    return asVideoId(url.pathname.slice(1))
  }

  // youtube.com/watch?v=ID
  if (url.pathname === '/watch') {
    return asVideoId(url.searchParams.get('v'))
  }

  // youtube.com/{embed,shorts,live}/ID
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length >= 2 && ['embed', 'shorts', 'live'].includes(segments[0])) {
    return asVideoId(segments[1])
  }

  return null
}

/**
 * URL d'embed sûre, ou null. L'origine est écrite en dur : rien de ce qui
 * vient de la base ne peut la changer, seul l'identifiant est repris.
 */
export function buildYouTubeEmbedUrl(rawUrl?: string | null): string | null {
  const videoId = extractYouTubeId(rawUrl)
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null
}

function asVideoId(candidate: string | null | undefined): string | null {
  if (!candidate) return null
  return VIDEO_ID_PATTERN.test(candidate) ? candidate : null
}
