/**
 * Client Storage Hook
 * Provides access to the shared client list used across the application
 * (Blog Builder, Document Editor, etc.)
 */

import { useState, useEffect } from 'react';
import { Client } from './ClientTypes';

// Hardcoded client list - matches blog-builder-tool.tsx
const DEFAULT_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Wellness Center",
    logo: "🏥",
    url: "https://wellnesscenter.com",
    bio: "A comprehensive mental health and wellness center offering counseling, therapy, and medication management services to individuals and families in the greater Seattle area.",
    thingsToAvoid:
      "Avoid clinical jargon, don't mention specific medications by name, avoid making medical claims or guarantees about treatment outcomes.",
    competitors: [
      { name: "Seattle Counseling Services", url: "https://seattlecounseling.com" },
      { name: "Mindful Therapy Group", url: "https://mindfultherapy.com" },
    ],
    ownUrls: [
      { name: "About Our Therapists", url: "https://wellnesscenter.com/about" },
      { name: "Insurance & Billing", url: "https://wellnesscenter.com/insurance" },
      { name: "Contact Us", url: "https://wellnesscenter.com/contact" },
    ],
    locations: [
      { title: "Seattle Main Office", address: "123 Pine St, Seattle, WA 98101" },
      { title: "Bellevue Branch", address: "456 Bellevue Way NE, Bellevue, WA 98004" },
    ],
    socialLinks: [
      { label: "Facebook", url: "https://facebook.com/wellnesscenter" },
      { label: "Instagram", url: "https://instagram.com/wellnesscenter" },
      { label: "LinkedIn", url: "https://linkedin.com/company/wellnesscenter" },
    ],
    defaultFormValues: {
      currentUrl: "https://wellnesscenter.com/about",
      businessName: "Wellness Center",
      niche: "Mental Health & Wellness Services",
      intendedResult:
        "Educate potential clients about our therapy services and encourage them to book a consultation",
      targetAudience:
        "Adults aged 25-55 seeking mental health support, therapy, or counseling services in the Seattle area",
      geoLocations: "Seattle, WA; Bellevue, WA; Greater Seattle Metropolitan Area",
      keywords: [
        "mental health counseling",
        "therapy services Seattle",
        "anxiety treatment",
        "depression counseling",
        "family therapy",
      ],
      additionalInstructions:
        "Emphasize our compassionate approach, licensed therapists, and flexible scheduling. Highlight insurance acceptance.",
      competitors: ["Seattle Counseling Services", "Mindful Therapy Group"],
      includeKeyPoints: true,
      contentPreference: "create",
    },
  },
  {
    id: "2",
    name: "Bright Smiles Dental",
    logo: "🦷",
    url: "https://brightsmilesdental.com",
    bio: "Modern dental practice specializing in cosmetic dentistry, Invisalign, and family dental care with locations across Portland, Oregon.",
    thingsToAvoid:
      "Don't use scary dental terminology, avoid discussing pain in detail, don't compare to other dental practices directly.",
    competitors: [
      { name: "Portland Dental Group", url: "https://portlanddentalgroup.com" },
      { name: "Smile Studio PDX", url: "https://smilestudiopdx.com" },
    ],
    ownUrls: [
      { name: "Services", url: "https://brightsmilesdental.com/services" },
      { name: "Our Team", url: "https://brightsmilesdental.com/team" },
    ],
    locations: [{ title: "Downtown Portland", address: "789 SW Broadway, Portland, OR 97205" }],
    socialLinks: [
      { label: "Facebook", url: "https://facebook.com/brightsmilesdental" },
      { label: "Yelp", url: "https://yelp.com/biz/bright-smiles-dental" },
    ],
    defaultFormValues: {
      currentUrl: "https://brightsmilesdental.com/services",
      businessName: "Bright Smiles Dental",
      niche: "Cosmetic & Family Dentistry",
      intendedResult: "Attract new patients interested in cosmetic dentistry and Invisalign treatments",
      targetAudience: "Adults aged 25-65 in Portland seeking cosmetic dental improvements or family dental care",
      geoLocations: "Portland, OR; Beaverton, OR; Lake Oswego, OR",
      keywords: [
        "cosmetic dentistry Portland",
        "Invisalign Portland",
        "teeth whitening",
        "family dentist",
        "dental implants",
      ],
      additionalInstructions:
        "Focus on modern technology, comfortable environment, and before/after results. Mention flexible payment plans.",
      competitors: ["Portland Dental Group", "Smile Studio PDX"],
      includeKeyPoints: true,
      contentPreference: "create",
    },
  },
  {
    id: "3",
    name: "TechFlow Solutions",
    logo: "💻",
    url: "https://techflowsolutions.com",
    bio: "B2B SaaS company providing workflow automation and project management tools for enterprise clients in the technology sector.",
    thingsToAvoid: "Avoid overly technical jargon, don't bash competitors, avoid making unrealistic ROI promises.",
    competitors: [
      { name: "Asana", url: "https://asana.com" },
      { name: "Monday.com", url: "https://monday.com" },
    ],
    ownUrls: [
      { name: "Product Features", url: "https://techflowsolutions.com/features" },
      { name: "Pricing", url: "https://techflowsolutions.com/pricing" },
    ],
    locations: [{ title: "HQ - San Francisco", address: "100 Market St, San Francisco, CA 94105" }],
    socialLinks: [
      { label: "LinkedIn", url: "https://linkedin.com/company/techflowsolutions" },
      { label: "Twitter", url: "https://twitter.com/techflowsolutions" },
      { label: "GitHub", url: "https://github.com/techflowsolutions" },
    ],
    defaultFormValues: {
      currentUrl: "https://techflowsolutions.com/features",
      businessName: "TechFlow Solutions",
      niche: "B2B SaaS - Workflow Automation & Project Management",
      intendedResult:
        "Generate qualified leads from enterprise technology companies looking for workflow automation solutions",
      targetAudience: "IT Directors, CTOs, and Project Managers at mid-to-large tech companies (100-5000 employees)",
      geoLocations: "United States, Canada, United Kingdom (Remote/SaaS)",
      keywords: [
        "workflow automation software",
        "project management tools",
        "enterprise automation",
        "team collaboration platform",
        "SaaS productivity",
      ],
      additionalInstructions:
        "Emphasize integration capabilities, security features, and ROI. Include case studies and data-driven results.",
      competitors: ["Asana", "Monday.com"],
      includeKeyPoints: true,
      contentPreference: "create",
    },
  },
  {
    id: "4",
    name: "Green Leaf HVAC",
    logo: "🌿",
    url: "https://greenleafhvac.com",
    bio: "Family-owned HVAC repair and installation company serving residential and commercial clients in Austin, Texas for over 20 years.",
    thingsToAvoid:
      "Don't use overly technical HVAC terms, avoid fear-mongering about system failures, don't mention specific competitor pricing.",
    competitors: [
      { name: "Austin Air Experts", url: "https://austinairexperts.com" },
      { name: "Cool Breeze HVAC", url: "https://coolbreezehvac.com" },
    ],
    ownUrls: [
      { name: "Services", url: "https://greenleafhvac.com/services" },
      { name: "Emergency Repair", url: "https://greenleafhvac.com/emergency" },
    ],
    locations: [{ title: "Austin Service Area", address: "2500 W Anderson Ln, Austin, TX 78757" }],
    socialLinks: [
      { label: "Facebook", url: "https://facebook.com/greenleafhvac" },
      { label: "Google Business", url: "https://g.page/greenleafhvac" },
    ],
    defaultFormValues: {
      currentUrl: "https://greenleafhvac.com/services",
      businessName: "Green Leaf HVAC",
      niche: "HVAC Repair & Installation Services",
      intendedResult: "Drive service calls and installation quotes from homeowners and businesses in Austin",
      targetAudience: "Homeowners and commercial property managers in Austin, TX needing HVAC repair or replacement",
      geoLocations: "Austin, TX; Round Rock, TX; Cedar Park, TX; Pflugerville, TX",
      keywords: [
        "HVAC repair Austin",
        "air conditioning installation",
        "furnace repair",
        "emergency HVAC service",
        "AC replacement Austin",
      ],
      additionalInstructions:
        "Highlight 20+ years of experience, family-owned values, 24/7 emergency service, and energy-efficient solutions.",
      competitors: ["Austin Air Experts", "Cool Breeze HVAC"],
      includeKeyPoints: true,
      contentPreference: "create",
    },
  },
  {
    id: "5",
    name: "Summit Legal Group",
    logo: "⚖️",
    url: "https://summitlegalgroup.com",
    bio: "Full-service law firm specializing in corporate law, intellectual property, and business litigation for startups and established companies.",
    thingsToAvoid:
      "Avoid legalese and complex terminology, don't guarantee case outcomes, avoid discussing specific case details or settlements.",
    competitors: [
      { name: "Corporate Law Partners", url: "https://corporatelawpartners.com" },
      { name: "IP Legal Associates", url: "https://iplegalassociates.com" },
    ],
    ownUrls: [
      { name: "Practice Areas", url: "https://summitlegalgroup.com/practice-areas" },
      { name: "Our Attorneys", url: "https://summitlegalgroup.com/attorneys" },
    ],
    locations: [{ title: "New York Office", address: "350 Fifth Ave, New York, NY 10118" }],
    socialLinks: [
      { label: "LinkedIn", url: "https://linkedin.com/company/summitlegalgroup" },
      { label: "Avvo", url: "https://avvo.com/summit-legal-group" },
    ],
    defaultFormValues: {
      currentUrl: "https://summitlegalgroup.com/practice-areas",
      businessName: "Summit Legal Group",
      niche: "Corporate Law & Intellectual Property",
      intendedResult: "Attract startups and established companies seeking corporate legal counsel and IP protection",
      targetAudience:
        "Founders, CEOs, and General Counsel at startups and mid-market companies in tech and innovation sectors",
      geoLocations: "New York, NY; San Francisco, CA; Boston, MA (serve clients nationwide)",
      keywords: [
        "corporate law firm",
        "intellectual property attorney",
        "startup legal services",
        "business litigation",
        "trademark registration",
      ],
      additionalInstructions:
        "Emphasize experience with tech startups, IP portfolio management, and proactive legal strategies. Mention successful case outcomes.",
      competitors: ["Corporate Law Partners", "IP Legal Associates"],
      includeKeyPoints: true,
      contentPreference: "create",
    },
  },
];

/**
 * Hook to access clients
 * Returns the full list of available clients
 */
export function useClients() {
  const [clients] = useState<Client[]>(DEFAULT_CLIENTS);

  return {
    clients,
    getClientById: (id: string) => clients.find((c) => c.id === id),
  };
}

/**
 * Hook to manage selected client state with localStorage persistence
 */
export function useSelectedClient() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientContextEnabled, setClientContextEnabled] = useState(false);
  const { getClientById } = useClients();

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('doc-selected-client-id');
    const enabledStored = localStorage.getItem('doc-client-context-enabled');

    if (stored) {
      setSelectedClientId(stored);
    }
    if (enabledStored !== null) {
      setClientContextEnabled(enabledStored === 'true');
    }
  }, []);

  // Save to localStorage when changed
  const handleSetSelectedClientId = (id: string | null) => {
    setSelectedClientId(id);
    if (id) {
      localStorage.setItem('doc-selected-client-id', id);
    } else {
      localStorage.removeItem('doc-selected-client-id');
    }
  };

  const handleSetClientContextEnabled = (enabled: boolean) => {
    setClientContextEnabled(enabled);
    localStorage.setItem('doc-client-context-enabled', enabled.toString());
  };

  const selectedClient = selectedClientId ? getClientById(selectedClientId) : null;

  return {
    selectedClientId,
    setSelectedClientId: handleSetSelectedClientId,
    clientContextEnabled,
    setClientContextEnabled: handleSetClientContextEnabled,
    selectedClient,
  };
}
