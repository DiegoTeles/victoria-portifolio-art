import type { LocalizedText, Locale } from './artworks'
import { getLocalized } from './artworks'

export type TaxonomyParentGallery = 'drawing-painting' | 'photography'

export type TaxonomySub = { slug: string; label: LocalizedText }

export type TaxonomyCategory = {
  gallery: TaxonomyParentGallery
  label: LocalizedText
  subs: TaxonomySub[]
}

export const galleryTaxonomy: TaxonomyCategory[] = [
  {
    gallery: 'drawing-painting',
    label: {
      'pt-Br': 'Desenhos e pinturas',
      en: 'Drawings and paintings',
      fr: 'Dessins et peintures',
      it: 'Disegni e pitture',
      de: 'Zeichnungen und Malerei',
    },
    subs: [
      {
        slug: 'exposicao-intimidade',
        label: {
          'pt-Br': 'Exposição Intimidade',
          en: 'Intimidade Exhibition',
          fr: 'Exposition Intimidade',
          it: 'Mostra Intimidade',
          de: 'Ausstellung Intimidade',
        },
      },
      {
        slug: 'exposicao-obsessao-fragilidade',
        label: {
          'pt-Br': 'Exposição Obsessão e Fragilidade',
          en: 'Obsession and Fragility Exhibition',
          fr: 'Exposition Obsession et Fragilité',
          it: 'Mostra Ossessione e Fragilità',
          de: 'Ausstellung Obsession und Zerbrechlichkeit',
        },
      },
    ],
  },
  {
    gallery: 'photography',
    label: {
      'pt-Br': 'Fotografia',
      en: 'Photography',
      fr: 'Photographie',
      it: 'Fotografia',
      de: 'Fotografie',
    },
    subs: [
      {
        slug: 'retratos',
        label: {
          'pt-Br': 'Retratos',
          en: 'Portraits',
          fr: 'Portraits',
          it: 'Ritratti',
          de: 'Porträts',
        },
      },
      {
        slug: 'terra-de-escape',
        label: {
          'pt-Br': 'Terra de escape',
          en: 'Land of escape',
          fr: 'Terre d’échappement',
          it: 'Terra di fuga',
          de: 'Land der Flucht',
        },
      },
      {
        slug: 'paisagem',
        label: {
          'pt-Br': 'Paisagem',
          en: 'Landscape',
          fr: 'Paysage',
          it: 'Paesaggio',
          de: 'Landschaft',
        },
      },
      {
        slug: 'abstracao',
        label: {
          'pt-Br': 'abstração',
          en: 'abstraction',
          fr: 'abstraction',
          it: 'astrazione',
          de: 'Abstraktion',
        },
      },
    ],
  },
]

export function getSubsForGallery(gallery: string | undefined): TaxonomySub[] | undefined {
  if (!gallery) return undefined
  return galleryTaxonomy.find((c) => c.gallery === gallery)?.subs
}

export function isValidSubForGallery(gallery: string | undefined, sub: string | null): boolean {
  if (!gallery || !sub) return false
  return Boolean(getSubsForGallery(gallery)?.some((s) => s.slug === sub))
}

export function taxonomySubLabel(slug: string, locale: Locale): string | undefined {
  for (const cat of galleryTaxonomy) {
    const hit = cat.subs.find((s) => s.slug === slug)
    if (hit) return getLocalized(hit.label, locale)
  }
  return undefined
}
