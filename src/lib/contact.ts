/**
 * Points de contact publics — source unique (DT-S25-03).
 *
 * Ces valeurs sont lues par la vitrine. Les écrire ici plutôt que dans le JSX
 * donne un seul endroit à corriger le jour où une adresse change, et surtout
 * un endroit où l'absence d'un canal se déclare explicitement.
 *
 * Un canal non encore ouvert vaut `null` : la page n'affiche alors AUCUN
 * bouton pour lui. Jamais de lien mort — un bouton qui ne mène nulle part sur
 * une page qui invite à écrire coûte plus qu'un bouton manquant.
 */

export interface ContactLink {
  label: string
  /** null = canal pas encore ouvert, le bouton n'est pas rendu. */
  href: string | null
}

export const CONTACT_EMAIL = 'contact@sterveshop.cloud'

/** Boutons du bloc contact, dans l'ordre d'affichage. */
export const CONTACT_LINKS: ContactLink[] = [
  { label: "M'écrire", href: `mailto:${CONTACT_EMAIL}` },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sterve-ai/' },
  // Nexlance : profil pas encore créé. Reste `null` jusque-là.
  { label: 'Nexlance', href: null },
]

/** Chaînes affichées discrètement dans le pied de page. */
export const SOCIAL_LINKS: ContactLink[] = [
  { label: 'TikTok', href: 'https://www.tiktok.com/@sterve.architecte.ia' },
  { label: 'YouTube', href: 'https://www.youtube.com/@iaarchitecte' },
]

/** Ne garde que les canaux réellement ouverts. */
export function activeLinks(links: ContactLink[]): (ContactLink & { href: string })[] {
  return links.filter((link): link is ContactLink & { href: string } =>
    Boolean(link.href)
  )
}
