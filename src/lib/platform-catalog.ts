import { LeadSource } from '@/types'
import { BRAND_ICONS } from './brand-icons'

export interface PlatformMeta {
  value: string
  label: string
  category: 'Property Portals' | 'Ads & Social'
  color: string // hex, no '#'
  monogram: string
  brandIconKey?: keyof typeof BRAND_ICONS
}

/**
 * Curated subset of LeadSource that realistically corresponds to an external
 * platform a Relationship Manager sends webhook leads from. The full
 * LeadSource enum also includes offline/manual sources (WALK_IN, REFERRAL,
 * COLD_CALLING, ...) which aren't "integrations" in this sense — those stay
 * selectable as manual lead sources elsewhere in the app, not here.
 */
export const PLATFORM_CATALOG: PlatformMeta[] = [
  { value: LeadSource.NINETYNINE_ACRES, label: '99acres', category: 'Property Portals', color: '00A551', monogram: '99' },
  { value: LeadSource.MAGIC_BRICKS, label: 'MagicBricks', category: 'Property Portals', color: 'ED6A2C', monogram: 'MB' },
  { value: LeadSource.HOUSING_COM, label: 'Housing.com', category: 'Property Portals', color: '00A6A6', monogram: 'H' },
  { value: LeadSource.NOBROKER, label: 'NoBroker', category: 'Property Portals', color: 'FF6B35', monogram: 'NB' },
  { value: LeadSource.SQUARE_YARDS, label: 'Square Yards', category: 'Property Portals', color: '0F3057', monogram: 'SY' },
  { value: LeadSource.PROP_TIGER, label: 'PropTiger', category: 'Property Portals', color: '7B2D8E', monogram: 'PT' },
  { value: LeadSource.REAL_ESTATE_INDIA, label: 'Real Estate India', category: 'Property Portals', color: '1D6FA5', monogram: 'RE' },
  { value: LeadSource.MAKAAN, label: 'Makaan', category: 'Property Portals', color: 'F7941E', monogram: 'MK' },
  { value: LeadSource.COMMON_FLOOR, label: 'CommonFloor', category: 'Property Portals', color: '2E8B7E', monogram: 'CF' },
  { value: LeadSource.OLX, label: 'OLX', category: 'Property Portals', color: '9013FE', monogram: 'OLX' },
  { value: LeadSource.HOME_ONLINE, label: 'Home Online', category: 'Property Portals', color: '0D9488', monogram: 'HO' },
  { value: LeadSource.TATA_HOUSING, label: 'Tata Housing', category: 'Property Portals', color: '1A3668', monogram: 'TH' },
  { value: LeadSource.FACEBOOK, label: 'Facebook', category: 'Ads & Social', color: '0866FF', monogram: 'f', brandIconKey: 'facebook' },
  { value: LeadSource.INSTAGRAM, label: 'Instagram', category: 'Ads & Social', color: 'FF0069', monogram: 'IG', brandIconKey: 'instagram' },
  { value: LeadSource.META_LEAD_ADS, label: 'Meta Lead Ads', category: 'Ads & Social', color: '0467DF', monogram: 'M', brandIconKey: 'meta' },
  { value: LeadSource.META_CLICK_TO_WHATSAPP, label: 'Click-to-WhatsApp', category: 'Ads & Social', color: '25D366', monogram: 'WA', brandIconKey: 'whatsapp' },
  { value: LeadSource.GOOGLE_ADS, label: 'Google Ads', category: 'Ads & Social', color: '4285F4', monogram: 'G', brandIconKey: 'google' },
  { value: LeadSource.GOOGLE_SEARCH, label: 'Google Search', category: 'Ads & Social', color: '4285F4', monogram: 'G', brandIconKey: 'google' },
  { value: LeadSource.GOOGLE_BUSINESS_PROFILE, label: 'Google Business Profile', category: 'Ads & Social', color: '4285F4', monogram: 'G', brandIconKey: 'google' },
  { value: LeadSource.YOUTUBE_ADS, label: 'YouTube Ads', category: 'Ads & Social', color: 'FF0000', monogram: 'YT', brandIconKey: 'youtube' },
]

export function getPlatformMeta(source: string): PlatformMeta {
  return (
    PLATFORM_CATALOG.find((p) => p.value === source) ?? {
      value: source,
      label: source,
      category: 'Property Portals',
      color: '64748B',
      monogram: source.slice(0, 2).toUpperCase(),
    }
  )
}
