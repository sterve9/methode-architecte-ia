import { describe, expect, test } from 'vitest'

import {
  buildYouTubeEmbedUrl,
  extractYouTubeId,
} from '@/modules/m3-preuves/domain/youtube-embed'

/**
 * `video_url` est saisi à la main puis destiné à l'attribut `src` d'une
 * `<iframe>` sur une page publique. Ces tests portent donc moins sur « est-ce
 * qu'on sait lire une URL YouTube » que sur « est-ce qu'on sait refuser tout
 * le reste » (DT-S25-02).
 */

const VIDEO_ID = 'dQw4w9WgXcQ' // 11 caractères, alphabet base64url

describe('extractYouTubeId — formats légitimes', () => {
  test.each([
    `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    `https://youtube.com/watch?v=${VIDEO_ID}`,
    `https://youtu.be/${VIDEO_ID}`,
    `https://www.youtu.be/${VIDEO_ID}`,
    `https://www.youtube.com/embed/${VIDEO_ID}`,
    `https://www.youtube.com/shorts/${VIDEO_ID}`,
    `https://www.youtube.com/live/${VIDEO_ID}`,
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`,
  ])('reconnaît « %s »', (url) => {
    expect(extractYouTubeId(url)).toBe(VIDEO_ID)
  })

  test('tolère les espaces autour de la saisie', () => {
    expect(extractYouTubeId(`  https://youtu.be/${VIDEO_ID}  `)).toBe(VIDEO_ID)
  })

  test('ignore les paramètres de suivi accolés à l’URL', () => {
    expect(
      extractYouTubeId(`https://www.youtube.com/watch?v=${VIDEO_ID}&t=42s&si=abc`)
    ).toBe(VIDEO_ID)
  })

  test('accepte une majuscule dans le nom d’hôte', () => {
    expect(extractYouTubeId(`https://WWW.YouTube.com/watch?v=${VIDEO_ID}`)).toBe(
      VIDEO_ID
    )
  })
})

describe('extractYouTubeId — ce qui doit être refusé', () => {
  test('un protocole exécutable, même avec « youtube » dans la chaîne', () => {
    expect(extractYouTubeId('javascript:alert(1)//youtube.com')).toBeNull()
    expect(extractYouTubeId(`data:text/html,<script>alert(1)</script>`)).toBeNull()
  })

  test('un hôte qui ressemble à YouTube sans en être un', () => {
    for (const url of [
      `https://youtube.com.attaquant.net/watch?v=${VIDEO_ID}`,
      `https://notyoutube.com/watch?v=${VIDEO_ID}`,
      `https://vimeo.com/${VIDEO_ID}`,
      `https://evil.com/embed/${VIDEO_ID}`,
    ]) {
      expect(extractYouTubeId(url)).toBeNull()
    }
  })

  test('une URL YouTube sans identifiant de vidéo', () => {
    expect(extractYouTubeId('https://www.youtube.com/')).toBeNull()
    expect(extractYouTubeId('https://www.youtube.com/watch')).toBeNull()
    expect(extractYouTubeId('https://www.youtube.com/@une-chaine')).toBeNull()
  })

  test('un identifiant de longueur invalide', () => {
    expect(extractYouTubeId('https://youtu.be/trop-court')).toBeNull()
    expect(extractYouTubeId(`https://youtu.be/${VIDEO_ID}XXXX`)).toBeNull()
  })

  test('une chaîne qui n’est pas une URL absolue', () => {
    expect(extractYouTubeId('youtube.com/watch?v=' + VIDEO_ID)).toBeNull()
    expect(extractYouTubeId('pas une url')).toBeNull()
  })

  test('une valeur vide, blanche ou absente', () => {
    expect(extractYouTubeId('')).toBeNull()
    expect(extractYouTubeId('   ')).toBeNull()
    expect(extractYouTubeId(null)).toBeNull()
    expect(extractYouTubeId(undefined)).toBeNull()
  })
})

describe('buildYouTubeEmbedUrl', () => {
  test('reconstruit une URL dont l’origine est la nôtre, pas celle saisie', () => {
    expect(buildYouTubeEmbedUrl(`https://youtu.be/${VIDEO_ID}`)).toBe(
      `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`
    )
  })

  test('ne reprend que l’identifiant : rien de la saisie ne survit', () => {
    const embed = buildYouTubeEmbedUrl(
      `https://www.youtube.com/watch?v=${VIDEO_ID}&onerror=alert(1)`
    )

    expect(embed).toBe(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`)
    expect(embed).not.toContain('onerror')
  })

  test('renvoie null plutôt qu’une URL dégradée quand l’entrée est refusée', () => {
    expect(buildYouTubeEmbedUrl('https://evil.com/video')).toBeNull()
    expect(buildYouTubeEmbedUrl(null)).toBeNull()
  })
})
