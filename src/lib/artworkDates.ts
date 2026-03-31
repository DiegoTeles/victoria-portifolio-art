import { compareAsc, format, getYear, parseISO } from 'date-fns'
import { de } from 'date-fns/locale/de'
import { enUS } from 'date-fns/locale/en-US'
import { fr } from 'date-fns/locale/fr'
import { it } from 'date-fns/locale/it'
import { ptBR } from 'date-fns/locale/pt-BR'
import type { Artwork, Locale as SiteLocale } from '../data/artworks'

const dateFnsLocales = {
  'pt-Br': ptBR,
  en: enUS,
  fr,
  it,
  de,
} as const

export function parseArtworkDate(artwork: Artwork): Date {
  return parseISO(artwork.date)
}

export function formatArtworkDate(
  artwork: Artwork,
  locale: SiteLocale,
  dateFormat = 'PPP'
): string {
  return format(parseArtworkDate(artwork), dateFormat, {
    locale: dateFnsLocales[locale],
  })
}

export function getArtworkYear(artwork: Artwork): number {
  return getYear(parseArtworkDate(artwork))
}

export function sortArtworksByDate(
  artworks: Artwork[],
  direction: 'asc' | 'desc'
): Artwork[] {
  const next = [...artworks].sort((a, b) =>
    compareAsc(parseArtworkDate(a), parseArtworkDate(b))
  )
  return direction === 'desc' ? next.reverse() : next
}

export function filterArtworksByYear(
  artworks: Artwork[],
  year: number
): Artwork[] {
  return artworks.filter((a) => getArtworkYear(a) === year)
}

export function getDistinctYears(artworks: Artwork[]): number[] {
  const years = new Set(artworks.map((a) => getArtworkYear(a)))
  return [...years].sort((a, b) => b - a)
}
