/**
 * Shared Client types
 * Extracted from blog-builder-tool.tsx to be reusable across features
 */

export interface Client {
  id: string
  name: string
  logo: string
  url: string
  bio: string
  thingsToAvoid: string
  competitors: { name: string; url: string }[]
  ownUrls: { name: string; url: string }[]
  locations: { title: string; address: string }[]
  socialLinks: { label: string; url: string }[]
  defaultFormValues: ContentOrderForm
}

export interface ContentOrderForm {
  currentUrl: string
  businessName: string
  niche: string
  intendedResult: string
  targetAudience: string
  geoLocations: string
  keywords: string[]
  additionalInstructions: string
  competitors: string[]
  includeKeyPoints: boolean
  contentPreference: "create" | "enhance"
}
