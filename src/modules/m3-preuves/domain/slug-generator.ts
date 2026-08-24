/**
 * Domaine M3 — Générateur de Slug Canonique pour Preuves Publiques
 * Transforme une chaîne de caractères en slug d'URL propre et valide.
 */

export function generateSlug(title: string, fallbackId?: string): string {
  if (!title || title.trim().length === 0) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `preuve-${fallbackId ? fallbackId.substring(0, 6) : randomSuffix}`;
  }

  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '')    // Garde uniquement alphanum, espaces et tirets
    .trim()
    .replace(/\s+/g, '-')            // Remplace les espaces par des tirets
    .replace(/-+/g, '-');            // Évite les tirets consécutifs

  if (slug.length === 0) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `preuve-${randomSuffix}`;
  }

  return slug.substring(0, 80); // Limite la longueur à 80 caractères
}
