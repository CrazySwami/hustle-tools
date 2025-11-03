"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Play,
  Eye,
  Edit2,
  Trash2,
  Plus,
  GripVertical,
  Globe,
  X,
  Sparkles,
  BookOpen,
  FileText,
  Building2,
  MapPin,
  Target,
  Users,
  Tag,
  AlertCircle,
  Upload,
  Copy,
  Share2,
  BarChart3,
  CheckCircle2,
  Zap,
  PlayCircle,
  Circle,
  User,
  Save,
  Search,
  Lightbulb,
  RotateCcw,
} from "lucide-react"

type StepStatus = "pending" | "running" | "complete" | "error"

interface Step {
  id: string
  title: string
  status: StepStatus
  expanded: boolean
}

interface Client {
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

interface ContentOrderForm {
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

interface Citation {
  title: string
  url: string
  favicon: string
  snippet: string
}

interface OutlineItem {
  id: string
  level: number
  text: string
}

interface Article {
  id: string
  title: string
  contentForm: ContentOrderForm
  steps: Step[]
  researchResponse: string
  citations: Citation[]
  outline: OutlineItem[]
  generatedContent: string
  analysisResults: {
    wordCount: number
    readabilityScore: number
    keywordFrequency: number
    avgSentenceLength: number
    paragraphCount: number
    headingCount: number
  }
  reviewTopic: string
  reviewKeyword: string
  reviewResponse: string
  suggestedEdits: string[]
  status: "pending" | "form-generated" | "approved" | "processing" | "complete" | "error" // Added form-generated and approved statuses
  expanded: boolean // Added expanded state for showing steps
  // Added fields for bulk article client selection
  clientId?: string
  clientName?: string
  clientLogo?: string
  form?: ContentOrderForm // Use this for bulk articles
}

export function BlogBuilderTool() {
  const [clients] = useState<Client[]>([
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
  ])

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showClientBio, setShowClientBio] = useState(false)
  const [editingBio, setEditingBio] = useState(false)

  const [bioText, setBioText] = useState("")
  const [thingsToAvoid, setThingsToAvoid] = useState("")
  const [competitors, setCompetitors] = useState<{ name: string; url: string }[]>([])
  const [ownUrls, setOwnUrls] = useState<{ name: string; url: string }[]>([])
  const [bulkUrlInput, setBulkUrlInput] = useState("")
  const [showBulkUrlInput, setShowBulkUrlInput] = useState(false)

  const [locations, setLocations] = useState<{ title: string; address: string }[]>([])
  const [socialLinks, setSocialLinks] = useState<{ label: string; url: string }[]>([])

  const [showPromptModal, setShowPromptModal] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [currentStepForPrompt, setCurrentStepForPrompt] = useState("")

  const [steps, setSteps] = useState<Step[]>([
    { id: "order-form", title: "Generate Content Order Form", status: "pending", expanded: true },
    { id: "research", title: "Research (Perplexity)", status: "pending", expanded: false },
    { id: "outline", title: "Generate Outline", status: "pending", expanded: false },
    { id: "content", title: "Generate Full Content", status: "pending", expanded: false },
    { id: "analysis", title: "Programmatic Analysis", status: "pending", expanded: false },
    { id: "review", title: "Content Review & Check", status: "pending", expanded: false },
  ])

  const [contentForm, setContentForm] = useState<ContentOrderForm>({
    currentUrl: "",
    businessName: "",
    niche: "",
    intendedResult: "",
    targetAudience: "",
    geoLocations: "",
    keywords: [],
    additionalInstructions: "",
    competitors: [],
    includeKeyPoints: true,
    contentPreference: "create",
  })

  const [researchResponse, setResearchResponse] = useState("")
  const [citations, setCitations] = useState<Citation[]>([])

  const [outline, setOutline] = useState<OutlineItem[]>([
    { id: "1", level: 2, text: "Introduction to the Topic" },
    { id: "2", level: 2, text: "Key Benefits and Features" },
    { id: "3", level: 3, text: "Benefit One: Detailed Explanation" },
    { id: "4", level: 3, text: "Benefit Two: Real-world Applications" },
    { id: "5", level: 2, text: "Implementation Guide" },
    { id: "6", level: 2, text: "Conclusion and Next Steps" },
  ])

  const [generatedContent, setGeneratedContent] =
    useState(`# Comprehensive Guide to Mental Health Counseling Services in Seattle

Mental health counseling has become an essential resource for individuals and families seeking support in navigating life's challenges. In the Seattle metropolitan area, access to quality mental health services has expanded significantly, offering residents a wide range of therapeutic approaches and specialized care options.

## Understanding Mental Health Counseling

Mental health counseling provides professional support for individuals experiencing emotional, psychological, or behavioral challenges. Licensed therapists work collaboratively with clients to develop coping strategies, process difficult emotions, and create positive changes in their lives.

### What to Expect from Counseling Services

When you begin counseling, your therapist will conduct an initial assessment to understand your concerns, goals, and background. This collaborative process helps establish a treatment plan tailored to your unique needs. Sessions typically occur weekly or bi-weekly, with each session lasting 50-60 minutes.

## Benefits of Professional Mental Health Support

Seeking professional mental health support offers numerous advantages for overall well-being and quality of life. Research consistently demonstrates that therapy can significantly improve symptoms of anxiety, depression, and other mental health conditions.

### Evidence-Based Treatment Approaches

Modern counseling practices utilize evidence-based therapeutic modalities including Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), and Eye Movement Desensitization and Reprocessing (EMDR). These approaches have been extensively researched and proven effective for treating various mental health concerns.

## Specialized Services Available

Mental health practices in Seattle offer specialized services for diverse populations and specific concerns. Many therapists have expertise in areas such as trauma recovery, relationship counseling, adolescent mental health, and stress management.

### Family and Couples Counseling

Family therapy addresses relationship dynamics and communication patterns that may be contributing to distress. Couples counseling helps partners strengthen their relationship, resolve conflicts, and develop healthier interaction patterns.

## Accessing Mental Health Services in Seattle

The Seattle area offers multiple pathways to accessing mental health support. Many practices accept insurance, offer sliding scale fees, and provide telehealth options for increased accessibility.

### Insurance and Payment Options

Most mental health practices work with major insurance providers and can verify coverage before your first appointment. For those without insurance, sliding scale fees based on income ensure that quality care remains accessible to all community members.

## Telehealth and Virtual Counseling

The expansion of telehealth services has made mental health support more accessible than ever. Virtual counseling sessions offer the same therapeutic benefits as in-person visits while providing added convenience and flexibility.

### Benefits of Online Therapy

Telehealth eliminates travel time, reduces scheduling conflicts, and allows clients to attend sessions from the comfort of their own homes. This format has proven particularly beneficial for individuals with mobility challenges, busy schedules, or those living in areas with limited access to mental health providers.

## Finding the Right Therapist

Selecting a therapist is a personal decision that should consider factors such as therapeutic approach, specialization, availability, and personal compatibility. Many practices offer free consultation calls to help potential clients determine if the therapist is a good fit.

### Questions to Ask When Choosing a Therapist

Consider asking about the therapist's experience with your specific concerns, their therapeutic approach, session frequency recommendations, and what to expect from the treatment process. A good therapeutic relationship is built on trust, respect, and open communication.

## Taking the First Step

Beginning therapy represents a courageous step toward improved mental health and well-being. Whether you're dealing with a specific challenge or seeking personal growth, professional counseling can provide valuable support and guidance.

If you're ready to explore counseling services, reach out to schedule a consultation. Many practices offer flexible scheduling, including evening and weekend appointments, to accommodate diverse needs and schedules.`)

  const [analysisResults, setAnalysisResults] = useState({
    wordCount: 0,
    readabilityScore: 0,
    keywordFrequency: 0,
    avgSentenceLength: 0,
    paragraphCount: 0,
    headingCount: 0,
  })

  const [reviewTopic, setReviewTopic] = useState("")
  const [reviewKeyword, setReviewKeyword] = useState("")
  const [additionalCheckCriteria, setAdditionalCheckCriteria] = useState("")
  const [reviewResponse, setReviewResponse] = useState("")
  const [suggestedEdits, setSuggestedEdits] = useState<string[]>([])

  const [bulkMode, setBulkMode] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0)
  const [showAddArticle, setShowAddArticle] = useState(false)
  // Simplified newArticle state to align with ContentOrderForm
  const [newArticle, setNewArticle] = useState<Partial<ContentOrderForm>>({
    currentUrl: "",
    businessName: "",
    niche: "",
    intendedResult: "",
    targetAudience: "",
    geoLocations: "",
    keywords: "",
    additionalInstructions: "",
    competitors: "",
    includeKeyPoints: true,
    contentPreference: "create",
  })
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null)

  // Model selection states
  const [globalModel, setGlobalModel] = useState('anthropic/claude-haiku-4-5-20251001')
  const [researchModel, setResearchModel] = useState('perplexity/sonar')
  const [formDescription, setFormDescription] = useState('')

  // Step 1 input fields (for single mode)
  const [primaryKeyword, setPrimaryKeyword] = useState('')
  const [contentDescription, setContentDescription] = useState('')
  const [showStep1Form, setShowStep1Form] = useState(false)

  // Variable viewer state
  const [viewingVariable, setViewingVariable] = useState<{ tag: string; content: string } | null>(null)

  // Helper functions for parsing AI-generated form text
  const extractField = (text: string, fieldName: string): string => {
    const regex = new RegExp(`${fieldName}:?\\s*(.+?)(?:\\n|$)`, 'i')
    const match = text.match(regex)
    return match ? match[1].trim() : ''
  }

  const extractList = (text: string, fieldName: string): string[] => {
    const regex = new RegExp(`${fieldName}:?\\s*(.+?)(?:\\n\\n|$)`, 'is')
    const match = text.match(regex)
    if (!match) return []
    return match[1].split(/[,;\n]/).map(item => item.trim()).filter(Boolean)
  }

  // Get available merge tags/variables based on completed steps
  const getAvailableVariables = (stepId: string) => {
    const variables: { tag: string; description: string; preview: string }[] = []

    // Content Form is always available after step 1
    if (contentForm.businessName) {
      variables.push({
        tag: '{{BUSINESS_NAME}}',
        description: 'Business/Company Name',
        preview: contentForm.businessName
      })
      variables.push({
        tag: '{{NICHE}}',
        description: 'Business Niche',
        preview: contentForm.niche
      })
      variables.push({
        tag: '{{TARGET_AUDIENCE}}',
        description: 'Target Audience',
        preview: contentForm.targetAudience
      })
      variables.push({
        tag: '{{KEYWORDS}}',
        description: 'Focus Keywords',
        preview: contentForm.keywords?.join(', ') || ''
      })
      variables.push({
        tag: '{{GEO_LOCATIONS}}',
        description: 'Geographic Locations',
        preview: contentForm.geoLocations
      })
      variables.push({
        tag: '{{INTENDED_RESULT}}',
        description: 'Intended Result/CTA',
        preview: contentForm.intendedResult
      })
    }

    // Research is available after step 2
    if (researchResponse && ['outline', 'content', 'analysis', 'review'].includes(stepId)) {
      variables.push({
        tag: '{{RESEARCH}}',
        description: 'Research Findings',
        preview: researchResponse.substring(0, 200) + '...'
      })
    }

    // Outline is available after step 3
    if (outline.length > 0 && ['content', 'analysis', 'review'].includes(stepId)) {
      const outlineText = outline.map(item => `${"  ".repeat(item.level - 2)}${"#".repeat(item.level)} ${item.text}`).join("\n")
      variables.push({
        tag: '{{OUTLINE}}',
        description: 'Article Outline',
        preview: outlineText.substring(0, 200) + '...'
      })
    }

    // Generated content is available after step 4
    if (generatedContent && ['analysis', 'review'].includes(stepId)) {
      variables.push({
        tag: '{{CONTENT}}',
        description: 'Generated Content',
        preview: generatedContent.substring(0, 200) + '...'
      })
    }

    // Analysis is available after step 5
    if (analysisResults && stepId === 'review') {
      variables.push({
        tag: '{{WORD_COUNT}}',
        description: 'Word Count',
        preview: analysisResults.wordCount?.toString() || '0'
      })
      variables.push({
        tag: '{{READABILITY_SCORE}}',
        description: 'Readability Score',
        preview: analysisResults.readabilityScore?.toString() || '0'
      })
      variables.push({
        tag: '{{KEYWORD_FREQUENCY}}',
        description: 'Keyword Frequency',
        preview: analysisResults.keywordFrequency?.toString() || '0'
      })
    }

    return variables
  }

  // Get full content for a variable tag
  const getVariableFullContent = (tag: string): string => {
    switch (tag) {
      case '{{BUSINESS_NAME}}':
        return contentForm.businessName
      case '{{NICHE}}':
        return contentForm.niche
      case '{{TARGET_AUDIENCE}}':
        return contentForm.targetAudience
      case '{{KEYWORDS}}':
        return contentForm.keywords?.join(', ') || ''
      case '{{INTENDED_RESULT}}':
        return contentForm.intendedResult
      case '{{GEO_LOCATIONS}}':
        return contentForm.geoLocations
      case '{{RESEARCH}}':
        return researchResponse || ''
      case '{{OUTLINE}}':
        return outline.map(item => `${"  ".repeat(item.level - 2)}${"#".repeat(item.level)} ${item.text}`).join("\n")
      case '{{CONTENT}}':
        return generatedContent || ''
      case '{{WORD_COUNT}}':
        return analysisResults?.wordCount?.toString() || '0'
      case '{{READABILITY_SCORE}}':
        return analysisResults?.readabilityScore?.toString() || '0'
      case '{{KEYWORD_FREQUENCY}}':
        return analysisResults?.keywordFrequency?.toString() || '0'
      default:
        return ''
    }
  }

  const toggleStep = (stepId: string) => {
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, expanded: !step.expanded } : step)))
  }

  const runStep = async (stepId: string) => {
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, status: "running", expanded: true } : step)))

    try {
      if (stepId === "order-form") {
        // Build description with priority on user input
        let description = '';
        if (contentDescription) {
          description = `PRIMARY FOCUS: ${contentDescription}\n\n`;
        }
        if (primaryKeyword) {
          description += `PRIMARY KEYWORD: ${primaryKeyword}\n\n`;
        }
        if (selectedClient) {
          description += `Generate a content order form for ${selectedClient.name}, a business in the ${contentForm.niche || 'general'} niche. ${selectedClient.bio}`;
        } else {
          description += 'Generate a general content order form.';
        }

        // Call the generate-form API
        const response = await fetch('/api/blog/generate-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            clientBio: selectedClient?.bio,
            currentUrl: contentForm.currentUrl,
            businessName: selectedClient?.name,
            model: globalModel
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Form generation failed: ${errorData.error || response.statusText}`);
        }

        const { form } = await response.json();

        // The API now returns structured JSON, not text to parse
        const parsedForm: ContentOrderForm = {
          currentUrl: contentForm.currentUrl, // Use the URL they selected
          businessName: selectedClient?.name || form.businessName,
          niche: form.niche || "General",
          intendedResult: form.intendedResult || "Contact us",
          targetAudience: form.targetAudience || "General audience",
          geoLocations: form.geoLocations || "United States",
          keywords: form.keywords || ["keyword"],
          additionalInstructions: form.additionalInstructions || "",
          competitors: contentForm.competitors || [], // Preserve manually entered competitors
          includeKeyPoints: form.includeKeyPoints !== undefined ? form.includeKeyPoints : true,
          contentPreference: form.contentPreference || "create",
        };

        setContentForm(parsedForm);
      } else if (stepId === "research") {
        // Call the research API with Perplexity
        const response = await fetch('/api/blog/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentForm,
            model: researchModel
          })
        });

        if (!response.ok) {
          throw new Error(`Research failed: ${response.statusText}`);
        }

        const { research, citations: apiCitations } = await response.json();

        setResearchResponse(research);

        // Use API citations if available, otherwise use empty array
        if (apiCitations && apiCitations.length > 0) {
          setCitations(apiCitations);
        } else {
          setCitations([]);
        }
      } else if (stepId === "outline") {
        // Call the outline API
        const response = await fetch('/api/blog/outline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentForm,
            research: researchResponse,
            model: globalModel
          })
        });

        if (!response.ok) {
          throw new Error(`Outline generation failed: ${response.statusText}`);
        }

        const { outline: outlineText } = await response.json();

        // Parse markdown outline into OutlineItem[] structure
        const lines = outlineText.split('\n').filter((line: string) => line.trim());
        const parsedOutline: OutlineItem[] = [];
        let itemId = 1;

        for (const line of lines) {
          // Match markdown headings (##, ###, etc.)
          const headingMatch = line.match(/^(#{2,6})\s+(.+)$/);
          if (headingMatch) {
            const level = headingMatch[1].length; // Count # characters
            const text = headingMatch[2].trim();
            parsedOutline.push({
              id: itemId.toString(),
              level,
              text
            });
            itemId++;
          }
        }

        setOutline(parsedOutline.length > 0 ? parsedOutline : [
          { id: "1", level: 2, text: "Introduction" },
          { id: "2", level: 2, text: "Main Content" },
          { id: "3", level: 2, text: "Conclusion" }
        ]);
      } else if (stepId === "content") {
        // Call the content generation API
        const response = await fetch('/api/blog/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentForm,
            research: researchResponse,
            outline: outline.map((item) => `${"  ".repeat(item.level - 2)}${"#".repeat(item.level)} ${item.text}`).join("\n"),
            model: globalModel
          })
        });

        if (!response.ok) {
          throw new Error(`Content generation failed: ${response.statusText}`);
        }

        const { content } = await response.json();
        setGeneratedContent(content);
      } else if (stepId === "analysis") {
        // Call the analysis API
        const response = await fetch('/api/blog/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: generatedContent,
            keywords: contentForm.keywords
          })
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }

        const { analysis } = await response.json();
        setAnalysisResults(analysis);

        setReviewTopic(contentForm.niche)
        setReviewKeyword(contentForm.keywords[0] || "")
      } else if (stepId === "review") {
        // Call the review API
        const response = await fetch('/api/blog/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: generatedContent,
            contentForm,
            analysis: analysisResults,
            topic: reviewTopic,
            keyword: reviewKeyword,
            additionalCriteria: additionalCheckCriteria,
            model: globalModel
          })
        });

        if (!response.ok) {
          throw new Error(`Review failed: ${response.statusText}`);
        }

        const { review, suggestedEdits: edits } = await response.json();
        setReviewResponse(review);
        setSuggestedEdits(edits);
      }

      setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status: "complete" } : step)))
    } catch (error: any) {
      console.error(`Error in step ${stepId}:`, error);
      setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status: "error" } : step)))
      alert(`Error in ${stepId}: ${error.message}`);
    }
  }

  const addArticle = () => {
    if (!newArticle.currentUrl || !newArticle.businessName) {
      alert("Please fill in at least the Current URL and Business Name")
      return
    }

    const article: Article = {
      id: Date.now().toString(),
      title: newArticle.businessName || "Untitled Article",
      contentForm: {
        currentUrl: newArticle.currentUrl || "",
        businessName: newArticle.businessName || "",
        niche: newArticle.niche || "",
        intendedResult: newArticle.intendedResult || "",
        targetAudience: newArticle.targetAudience || "",
        geoLocations: newArticle.geoLocations || "",
        keywords:
          newArticle.keywords
            ?.split(",")
            .map((k) => k.trim())
            .filter(Boolean) || [],
        additionalInstructions: newArticle.additionalInstructions || "",
        competitors:
          newArticle.competitors
            ?.split(",")
            .map((c) => c.trim())
            .filter(Boolean) || [],
        includeKeyPoints: newArticle.includeKeyPoints || false, // Corrected from keyPoints
        contentPreference: newArticle.contentPreference || "create", // Corrected from pageContentPreference
      },
      steps: [
        { id: "order-form", title: "Generate Content Order Form", status: "pending", expanded: false },
        { id: "research", title: "Research & Citations", status: "pending", expanded: false },
        { id: "outline", title: "Generate Outline", status: "pending", expanded: false },
        { id: "content", title: "Generate First Draft", status: "pending", expanded: false },
        { id: "analysis", title: "Programmatic Analysis", status: "pending", expanded: false },
        { id: "review", title: "Content Review & Check", status: "pending", expanded: false },
      ],
      researchResponse: "",
      citations: [],
      outline: [],
      generatedContent: "",
      analysisResults: {
        wordCount: 0,
        readabilityScore: 0,
        keywordFrequency: 0,
        avgSentenceLength: 0,
        paragraphCount: 0,
        headingCount: 0,
      },
      reviewTopic: "",
      reviewKeyword: "",
      reviewResponse: "",
      suggestedEdits: [],
      status: "pending",
      expanded: false,
    }

    setArticles([...articles, article])
    setNewArticle({
      currentUrl: "",
      businessName: "",
      niche: "",
      intendedResult: "",
      targetAudience: "",
      geoLocations: "",
      keywords: "",
      additionalInstructions: "",
      competitors: "",
      includeKeyPoints: true,
      contentPreference: "create",
    })
    setShowAddArticle(false)
  }

  const removeArticle = (articleId: string) => {
    setArticles(articles.filter((a) => a.id !== articleId))
  }

  const generateAllForms = () => {
    const pendingArticles = articles.filter((a) => a.status === "pending")
    if (pendingArticles.length === 0) return

    const processFormGeneration = (index: number) => {
      if (index >= pendingArticles.length) return

      const articleId = pendingArticles[index].id
      setArticles((prev) =>
        prev.map((article) =>
          article.id === articleId
            ? {
                ...article,
                status: "processing",
                steps: article.steps.map((step) =>
                  step.id === "order-form" ? { ...step, status: "running", expanded: true } : step,
                ),
              }
            : article,
        ),
      )

      // Simulate form generation
      setTimeout(() => {
        setArticles((prev) =>
          prev.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  status: "form-generated",
                  steps: article.steps.map((step) =>
                    step.id === "order-form" ? { ...step, status: "complete", expanded: false } : step,
                  ),
                }
              : article,
          ),
        )
        // Move to next article
        setTimeout(() => processFormGeneration(index + 1), 500)
      }, 2000)
    }

    processFormGeneration(0)
  }

  const processAllArticles = () => {
    const approvedArticles = articles.filter((a) => a.status === "approved")
    if (approvedArticles.length === 0) return

    const processArticle = (index: number) => {
      if (index >= approvedArticles.length) return

      const articleId = approvedArticles[index].id
      setArticles((prev) =>
        prev.map((article) => (article.id === articleId ? { ...article, status: "processing" } : article)),
      )

      // Process steps 2-6 for this article (skip order-form since it's already done)
      const processSteps = (stepIndex: number) => {
        if (stepIndex >= 5) {
          // All steps complete for this article
          setArticles((prev) =>
            prev.map((article) => (article.id === articleId ? { ...article, status: "complete" } : article)),
          )
          // Move to next article
          setTimeout(() => processArticle(index + 1), 1000)
          return
        }

        const stepId = ["research", "outline", "content", "analysis", "review"][stepIndex]

        setArticles((prev) =>
          prev.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  steps: article.steps.map((step) =>
                    step.id === stepId ? { ...step, status: "running", expanded: true } : step,
                  ),
                }
              : article,
          ),
        )

        // Simulate step processing
        setTimeout(() => {
          setArticles((prev) =>
            prev.map((article) =>
              article.id === articleId
                ? {
                    ...article,
                    steps: article.steps.map((step) =>
                      step.id === stepId ? { ...step, status: "complete", expanded: false } : step,
                    ),
                  }
                : article,
            ),
          )
          processSteps(stepIndex + 1)
        }, 3000)
      }

      processSteps(0)
    }

    processArticle(0)
  }

  const toggleArticleExpansion = (articleId: string) => {
    setArticles((prev) =>
      prev.map((article) => (article.id === articleId ? { ...article, expanded: !article.expanded } : article)),
    )
  }

  const approveArticle = (articleId: string) => {
    setArticles((prev) =>
      prev.map((article) => (article.id === articleId ? { ...article, status: "approved" } : article)),
    )
  }

  const updateArticleForm = (articleId: string, updatedForm: Partial<ContentOrderForm>) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === articleId
          ? {
              ...article,
              contentForm: {
                ...article.contentForm,
                ...updatedForm,
                keywords:
                  typeof updatedForm.keywords === "string"
                    ? updatedForm.keywords
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean)
                    : article.contentForm.keywords,
                competitors:
                  typeof updatedForm.competitors === "string"
                    ? updatedForm.competitors
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean)
                    : article.contentForm.competitors,
              },
            }
          : article,
      ),
    )
    if (
      updatedForm.currentUrl ||
      updatedForm.businessName ||
      updatedForm.niche ||
      updatedForm.keywords ||
      updatedForm.additionalInstructions
    ) {
      // Re-validate if critical fields were changed
      setArticles((prev) =>
        prev.map((article) => (article.id === articleId ? { ...article, status: "form-generated" } : article)),
      )
    }
    setEditingArticleId(null)
  }

  const runAllSteps = () => {
    const runSequentially = (index: number) => {
      if (index >= steps.length) return

      const stepId = steps[index].id
      runStep(stepId)

      setTimeout(() => {
        runSequentially(index + 1)
      }, 3500)
    }

    runSequentially(0)
  }

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case "complete":
        return <Check className="h-4 w-4 text-green-600" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case "complete":
        return "border-l-green-500 bg-white"
      case "running":
        return "border-l-blue-500 bg-blue-50/50"
      case "error":
        return "border-l-red-500 bg-red-50/50"
      default:
        return "border-l-gray-200 bg-white"
    }
  }

  const moveOutlineItem = (id: string, direction: "up" | "down") => {
    const index = outline.findIndex((item) => item.id === id)
    if ((direction === "up" && index === 0) || (direction === "down" && index === outline.length - 1)) return

    const newOutline = [...outline]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newOutline[index], newOutline[targetIndex]] = [newOutline[targetIndex], newOutline[index]]
    setOutline(newOutline)
  }

  const deleteOutlineItem = (id: string) => {
    setOutline(outline.filter((item) => item.id !== id))
  }

  const addOutlineItem = () => {
    const newItem: OutlineItem = {
      id: Date.now().toString(),
      level: 2,
      text: "New Section",
    }
    setOutline([...outline, newItem])
  }

  const addCompetitor = () => {
    setCompetitors([...competitors, { name: "", url: "" }])
  }

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index))
  }

  const updateCompetitor = (index: number, field: "name" | "url", value: string) => {
    const updated = [...competitors]
    updated[index][field] = value
    setCompetitors(updated)
  }

  const addOwnUrl = () => {
    setOwnUrls([...ownUrls, { name: "", url: "" }])
  }

  const removeOwnUrl = (index: number) => {
    setOwnUrls(ownUrls.filter((_, i) => i !== index))
  }

  const updateOwnUrl = (index: number, field: "name" | "url", value: string) => {
    const updated = [...ownUrls]
    updated[index][field] = value
    setOwnUrls(updated)
  }

  const addLocation = () => {
    setLocations([...locations, { title: "", address: "" }])
  }

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index))
  }

  const updateLocation = (index: number, field: "title" | "address", value: string) => {
    const updated = [...locations]
    updated[index][field] = value
    setLocations(updated)
  }

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { label: "", url: "" }])
  }

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  const updateSocialLink = (index: number, field: "label" | "url", value: string) => {
    const updated = [...socialLinks]
    updated[index][field] = value
    setSocialLinks(updated)
  }

  const handleBulkUrlPaste = () => {
    // Parse CSV or line-separated URLs
    const lines = bulkUrlInput.split("\n").filter((line) => line.trim())
    const newUrls = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim())
      if (parts.length >= 2) {
        return { name: parts[0], url: parts[1] }
      } else {
        return { name: parts[0], url: parts[0] }
      }
    })
    setOwnUrls([...ownUrls, ...newUrls])
    setBulkUrlInput("")
    setShowBulkUrlInput(false)
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setBioText(client.bio)
    setThingsToAvoid(client.thingsToAvoid)
    setCompetitors([...client.competitors])
    setOwnUrls([...client.ownUrls])
    setLocations([...client.locations])
    setSocialLinks([...client.socialLinks])

    // Auto-populate form with client's default values
    setContentForm({ ...client.defaultFormValues })

    setShowClientDropdown(false)
  }

  const handleSaveClientData = () => {
    if (selectedClient) {
      selectedClient.bio = bioText
      selectedClient.thingsToAvoid = thingsToAvoid
      selectedClient.competitors = [...competitors]
      selectedClient.ownUrls = [...ownUrls]
      selectedClient.locations = [...locations]
      selectedClient.socialLinks = [...socialLinks]
    }
    setEditingBio(false)
  }

  const [clientBioTab, setClientBioTab] = useState<"bio" | "defaults">("bio")
  const [editingDefaults, setEditingDefaults] = useState(false)
  const [tempDefaultForm, setTempDefaultForm] = useState<ContentOrderForm | null>(null)

  const resetToClientDefaults = () => {
    if (selectedClient) {
      setContentForm({ ...selectedClient.defaultFormValues })
    }
  }

  const handleSaveDefaultForm = () => {
    if (selectedClient && tempDefaultForm) {
      // Find the client in the main clients state and update its defaultFormValues
      const clientIndex = clients.findIndex((c) => c.id === selectedClient.id)
      if (clientIndex !== -1) {
        clients[clientIndex].defaultFormValues = { ...tempDefaultForm }
        // Update the state to reflect the change (optional if you don't re-render based on clients state elsewhere)
        // For this component, it's enough that selectedClient.defaultFormValues is updated if it's the source of tempDefaultForm
      }
      selectedClient.defaultFormValues = { ...tempDefaultForm } // Update the currently selected client object directly
      setEditingDefaults(false)
      setTempDefaultForm(null)
    }
  }

  const viewPrompt = (stepId: string) => {
    let prompt = ""

    if (stepId === "order-form") {
      prompt = `ROLE & GOAL
You are an expert web copy brief generator. Produce a fully completed "Service Page Brief" using verified information from the client's website and minimal Q&A only for gaps. Default to doing as much as possible from the provided URL(s), brand name, and service focus.

INPUTS (I will supply some/all)
- MODE: AUTO
- PRIMARY_URL: ${selectedClient?.ownUrls[0]?.url || selectedClient?.url || ""}
- ALT_PAGES (optional): ${
        selectedClient?.ownUrls
          .slice(1, 4)
          .map((u) => u.url)
          .join(", ") || ""
      }
- BUSINESS_NAME: ${selectedClient?.name || ""}
- SERVICE_FOCUS: ${contentForm.niche || ""}
- GEO_FOCUS: ${contentForm.geoLocations || ""}
- NOTES: ${contentForm.additionalInstructions || ""}
- REFERENCE_SITES (optional): ${selectedClient?.competitors.map((c) => c.url).join(", ") || ""}

CLIENT BIO:
${selectedClient?.bio || ""}

THINGS TO AVOID:
${selectedClient?.thingsToAvoid || ""}

LOCATIONS:
${selectedClient?.locations.map((l) => `${l.title}: ${l.address}`).join("\n") || ""}

SOCIAL & OTHER LINKS:
${selectedClient?.socialLinks.map((s) => `${s.label}: ${s.url}`).join("\n") || ""}

MODE & DEFAULTS
- If MODE is BLANK → output the blank form only (unfilled).
- Else (AUTO default): Research first. Fill all fields from PRIMARY_URL/ALT_PAGES + BUSINESS_NAME. Use REFERENCE_SITES for market context only (never to claim services not on client site).
- If PRIMARY_URL is missing/unclear OR critical fields remain unknown after research → switch to Q&A for ONLY the missing items (ask one question at a time), then finish the form.

RESEARCH-FIRST POLICY
- Prioritize client site (PRIMARY_URL, ALT_PAGES). Extract: exact business/brand name, services/sub-services, CTAs, phone numbers, booking paths, locations/addresses, ages/populations, special programs, insurance/eligibility, telehealth coverage, hours (if relevant), differentiators.
- Cross-check only to clarify terms or local market context (do not copy claims).
- If any field isn't stated on the client site, write "N/A (not stated on site)". Do NOT invent details.

Please generate a detailed content order form following the template structure provided.`
    } else if (stepId === "research") {
      prompt = `Research the following topic using web sources:

Business: ${contentForm.businessName}
Niche: ${contentForm.niche}
Target Audience: ${contentForm.targetAudience}
Keywords: ${contentForm.keywords.join(", ")}

Find information about:
1. Industry trends and best practices
2. Target audience pain points and needs
3. Competitor strategies and positioning
4. SEO opportunities and content gaps
5. Local market insights for: ${contentForm.geoLocations}

Provide a comprehensive markdown-formatted research report with citations.`
    } else if (stepId === "outline") {
      prompt = `# Master Prompt — ${contentForm.businessName} Service Page

**Use this prompt to transform structured form inputs into a high-converting, attorney-facing service page.**

## FORM INPUTS
CURRENT_URL: ${contentForm.currentUrl}
BUSINESS_NAME: ${contentForm.businessName}
SERVICE_NAME: ${contentForm.niche}
TARGET_AUDIENCE: ${contentForm.targetAudience}
PRIMARY_CTAS: ${contentForm.intendedResult}
LOCATIONS_LIST: ${contentForm.geoLocations}
KEYWORDS_LIST: ${contentForm.keywords.join("; ")}
ADDITIONAL_INSTRUCTIONS: ${contentForm.additionalInstructions}

## ROLE & TONE
You are a senior legal-services copywriter and SEO/AEO strategist writing for attorneys, paralegals, insurers/TPAs, and trustees. Tone is authoritative, precise, and litigation-ready.

## RESEARCH REQUIREMENTS
- Review the sites in COMPETITORS_FOR_RESEARCH and any reputable sources to validate terminology and standard practices.
- Do not copy text; do use findings to inform accurate, defensible descriptions.
- The final page should not cite external sources; research is for accuracy only.

## STRUCTURE & FORMATTING RULES (STRICT)
- H1 once; frequent H2/H3s for skimmability.
- Use bracket-style inline CTAs
- Include a high-visibility At-a-Glance box (6–8 bullets) near the top.
- Include the Process map (5 steps) with bold step labels.
- Include Locations & Coverage using the exact bolded location line format.
- Include FAQs (5–7 Q&As) oriented to litigation workflows.
- Close with a Final CTA and a Legal/Service Disclaimer.
- Natural keyword placement using KEYWORDS_LIST.

Generate a detailed outline first, then write the full page content.`
    } else if (stepId === "content") {
      prompt = `# Master Prompt — Service Page Content Generation

**Use this prompt to transform structured form inputs into a high-converting, SEO-optimized service page.**

## FORM INPUTS:
CURRENT_URL: "${contentForm.currentUrl}"
BUSINESS_NAME: "${contentForm.businessName}"
SERVICE_NAME: "${contentForm.niche}"
TARGET_AUDIENCE: "${contentForm.targetAudience}"
PRIMARY_CTAS: ${contentForm.intendedResult}
KEYWORDS_LIST: ${contentForm.keywords.join("; ")}
LOCATIONS_LIST: ${contentForm.geoLocations}

## OUTLINE:
${outline.map((item) => `${"  ".repeat(item.level - 2)}${item.text}`).join("\n")}

## RESEARCH CONTEXT:
${researchResponse.substring(0, 500)}...

## REQUIREMENTS:
- Tone: Professional yet approachable
- Length: ~2,500 words
- Include: ${contentForm.includeKeyPoints ? "Key points summary at top" : "No summary needed"}
- Natural keyword placement
- Clear CTAs throughout
- Evidence-based information

Generate full markdown-formatted content with proper headings, paragraphs, and SEO optimization.`
    } else if (stepId === "analysis") {
      prompt = `Perform programmatic analysis on the generated content:

Content Length: ${generatedContent.length} characters
Focus Keyword: "${contentForm.keywords[0] || ""}"

Calculate and report:
1. Total word count
2. Readability score (Flesch Reading Ease)
3. Focus keyword frequency and density
4. Average sentence length
5. Paragraph count
6. Heading structure (H1, H2, H3 distribution)
7. Content quality metrics

Provide specific recommendations for optimization.`
    } else if (stepId === "review") {
      prompt = `Review the generated content and check if it aligns with the requirements.

TOPIC: ${reviewTopic}
FOCUS KEYWORD: ${reviewKeyword}
ADDITIONAL CHECK CRITERIA: ${additionalCheckCriteria}

Does it align with the topic and keyword?

Also, does it answer all of these questions from The Hoth:

1. Current URL: ${contentForm.currentUrl}
2. Business/Company Name: ${contentForm.businessName}
3. Niche: ${contentForm.niche}
4. Intended Result of the page: ${contentForm.intendedResult}
5. Target Audience: ${contentForm.targetAudience}
6. Geographical Location: ${contentForm.geoLocations}
7. Relevant Keywords: ${contentForm.keywords.join(", ")}
8. Additional Instructions for the writers: ${contentForm.additionalInstructions}
9. Competitors to review: ${selectedClient?.competitors.map((c) => c.name).join(", ") || "N/A"}
10. Include a bulleted list that summarizes key points: ${contentForm.includeKeyPoints ? "Yes" : "No"}
11. Page Content Preference: ${contentForm.contentPreference}

CONTENT TO REVIEW:
${generatedContent}

Provide a detailed review with specific feedback and suggested edits.`
    }

    setCurrentPrompt(prompt)
    setCurrentStepForPrompt(stepId)
    setShowPromptModal(true)
  }

  // Added simulate executing suggested edits
  const executeEdits = () => {
    setSteps(steps.map((step) => (step.id === "review" ? { ...step, status: "running", expanded: true } : step)))

    setTimeout(() => {
      // Simulate applying edits to content
      setGeneratedContent((prev) => prev + "\n\n[Edits applied successfully]")
      setSteps(steps.map((step) => (step.id === "review" ? { ...step, status: "complete" } : step)))
    }, 2000)
  }

  // Added currentStep state to determine when to show Reset button
  const [currentStep, setCurrentStep] = useState(0)

  // Updated handler to track current step
  const handleStepChange = (newStepIndex: number) => {
    setCurrentStep(newStepIndex)
    // Optional: Update step statuses or other logic here if needed
  }

  // Updated runStep to call handleStepChange
  const runStepWrapper = (stepId: string) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId)
    runStep(stepId)
    if (stepIndex !== -1) {
      handleStepChange(stepIndex)
    }
  }

  // Updated runAllSteps to call runStepWrapper and handleStepChange
  const runAllStepsWrapper = () => {
    const runSequentially = (index: number) => {
      if (index >= steps.length) {
        handleStepChange(steps.length) // Set current step to the end
        return
      }

      const stepId = steps[index].id
      runStepWrapper(stepId) // Use the wrapper

      setTimeout(() => {
        runSequentially(index + 1)
      }, 3500) // Ensure this timeout is longer than the simulated step run time
    }

    handleStepChange(0) // Reset current step when starting all
    runSequentially(0)
  }

  // Modified addArticle to correctly map fields for Article.contentForm
  const addArticleCorrected = () => {
    if (!newArticle.currentUrl || !newArticle.businessName) {
      alert("Please fill in at least the Current URL and Business Name")
      return
    }

    // Map newArticle fields to ContentOrderForm structure
    const articleContentForm: ContentOrderForm = {
      currentUrl: newArticle.currentUrl || "",
      businessName: newArticle.businessName || "",
      niche: newArticle.niche || "",
      intendedResult: newArticle.intendedResult || "",
      targetAudience: newArticle.targetAudience || "",
      geoLocations: newArticle.geoLocations || "",
      keywords:
        newArticle.keywords
          ?.split(",")
          .map((k) => k.trim())
          .filter(Boolean) || [],
      additionalInstructions: newArticle.additionalInstructions || "",
      competitors:
        newArticle.competitors
          ?.split(",")
          .map((c) => c.trim())
          .filter(Boolean) || [],
      includeKeyPoints: newArticle.includeKeyPoints ?? true,
      contentPreference: newArticle.contentPreference || "create",
    }

    const article: Article = {
      id: Date.now().toString(),
      title: newArticle.businessName || "Untitled Article",
      contentForm: articleContentForm,
      steps: [
        { id: "order-form", title: "Generate Content Order Form", status: "pending", expanded: false },
        { id: "research", title: "Research & Citations", status: "pending", expanded: false },
        { id: "outline", title: "Generate Outline", status: "pending", expanded: false },
        { id: "content", title: "Generate First Draft", status: "pending", expanded: false },
        { id: "analysis", title: "Programmatic Analysis", status: "pending", expanded: false },
        { id: "review", title: "Content Review & Check", status: "pending", expanded: false },
      ],
      researchResponse: "",
      citations: [],
      outline: [],
      generatedContent: "",
      analysisResults: {
        wordCount: 0,
        readabilityScore: 0,
        keywordFrequency: 0,
        avgSentenceLength: 0,
        paragraphCount: 0,
        headingCount: 0,
      },
      reviewTopic: "",
      reviewKeyword: "",
      reviewResponse: "",
      suggestedEdits: [],
      status: "pending",
      expanded: false,
    }

    setArticles([...articles, article])
    setNewArticle({
      currentUrl: "",
      businessName: "",
      niche: "",
      intendedResult: "",
      targetAudience: "",
      geoLocations: "",
      keywords: "",
      additionalInstructions: "",
      competitors: "",
      includeKeyPoints: true,
      contentPreference: "create",
    })
    setShowAddArticle(false)
  }

  const handleBulkArticleClientSelect = (articleId: string, client: Client) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === articleId
          ? {
              ...article,
              clientId: client.id,
              clientName: client.name,
              clientLogo: client.logo,
              // Use the defaultFormValues from the selected client to populate the article's form
              form: { ...client.defaultFormValues },
            }
          : article,
      ),
    )
  }

  const resetBulkArticleToDefaults = (articleId: string) => {
    const article = articles.find((a) => a.id === articleId)
    if (article && article.clientId) {
      // Ensure clientId exists
      const client = clients.find((c) => c.id === article.clientId)
      if (client) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === articleId
              ? { ...a, form: { ...client.defaultFormValues } } // Ensure 'form' key exists or use contentForm
              : a,
          ),
        )
      }
    }
  }

  // Get current step index for progress bar and reset button visibility
  const currentStepIndex = steps.findIndex((step) => step.status === "pending" || step.status === "running")
  const stepIndexForReset = currentStepIndex === -1 ? steps.length : currentStepIndex

  return (
    // Two-column layout: 35% left (client/steps) / 65% right (content)
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="h-screen flex overflow-hidden">
        {/* LEFT COLUMN - Client Selector & Steps (35%) */}
        <div className="w-[35%] border-r border-gray-200 bg-white flex flex-col">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="space-y-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg shadow-md animate-in zoom-in duration-500">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg tracking-tight text-gray-900">Content Order Form Generator</h3>
                    <p className="text-xs text-gray-500">AI-powered service page brief creation</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300"
                  // Use wrapper function
                  onClick={runAllStepsWrapper}
                  disabled={!selectedClient}
                >
                  <Play className="h-3 w-3 mr-1.5" />
                  Run All Steps
                </Button>
              </div>

              {/* Client Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Client</label>
                <div className="relative">
                  <button
                    onClick={() => setShowClientDropdown(!showClientDropdown)}
                    className="w-full flex items-center justify-between gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-all duration-200"
                  >
                    {selectedClient ? (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedClient.logo}</span>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{selectedClient.name}</div>
                          <div className="text-xs text-gray-500">{selectedClient.url}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Choose a client...</span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showClientDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showClientDropdown && (
                    <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {clients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-2xl">{client.logo}</span>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-gray-900">{client.name}</div>
                            <div className="text-xs text-gray-500">{client.url}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedClient && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => setShowClientBio(true)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View/Edit Client Bio
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBulkMode(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !bulkMode ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Single Article
                </button>
                <button
                  onClick={() => setBulkMode(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    bulkMode ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Bulk Mode
                </button>
              </div>

              {bulkMode && articles.length > 0 && (
                <button
                  onClick={processAllArticles}
                  disabled={articles.some((a) => a.status === "processing")}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {articles.some((a) => a.status === "processing") ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Process All Articles
                    </>
                  )}
                </button>
              )}
            </div>

            {bulkMode ? (
              <div className="space-y-6">
                {/* Add Article Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Articles Queue</h3>
                    <div className="flex items-center gap-3">
                      {articles.some((a) => a.status === "pending") && (
                        <button
                          onClick={generateAllForms}
                          disabled={articles.some((a) => a.status === "processing")}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileText className="w-4 h-4" />
                          Generate Forms
                        </button>
                      )}
                      {articles.some((a) => a.status === "approved") && (
                        <button
                          onClick={processAllArticles}
                          disabled={articles.some((a) => a.status === "processing")}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {articles.some((a) => a.status === "processing") ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4" />
                              Process Approved
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setShowAddArticle(!showAddArticle)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Article
                      </button>
                    </div>
                  </div>

                  {showAddArticle && (
                    <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current URL <span className="text-red-500">*</span>
                          </label>
                          {selectedClient && selectedClient.ownUrls.length > 0 ? (
                            <select
                              value={newArticle.currentUrl}
                              onChange={(e) => setNewArticle({ ...newArticle, currentUrl: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select a URL</option>
                              {selectedClient.ownUrls.map((url, index) => (
                                <option key={index} value={url.url}>
                                  {url.name} - {url.url}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="url"
                              value={newArticle.currentUrl}
                              onChange={(e) => setNewArticle({ ...newArticle, currentUrl: e.target.value })}
                              placeholder="https://example.com/page"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business/Company Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newArticle.businessName}
                            onChange={(e) => setNewArticle({ ...newArticle, businessName: e.target.value })}
                            placeholder="Enter business name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
                          <input
                            type="text"
                            value={newArticle.niche}
                            onChange={(e) => setNewArticle({ ...newArticle, niche: e.target.value })}
                            placeholder="e.g., Healthcare, Technology"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                          <input
                            type="text"
                            value={newArticle.targetAudience}
                            onChange={(e) => setNewArticle({ ...newArticle, targetAudience: e.target.value })}
                            placeholder="e.g., Small business owners"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                        <input
                          type="text"
                          value={newArticle.keywords}
                          onChange={(e) => setNewArticle({ ...newArticle, keywords: e.target.value })}
                          placeholder="keyword1, keyword2, keyword3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Intended Result</label>
                        <textarea
                          value={newArticle.intendedResult}
                          onChange={(e) => setNewArticle({ ...newArticle, intendedResult: e.target.value })}
                          placeholder="What should this content achieve?"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Instructions</label>
                        <textarea
                          value={newArticle.additionalInstructions}
                          onChange={(e) => setNewArticle({ ...newArticle, additionalInstructions: e.target.value })}
                          placeholder="Any specific requirements or guidelines..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={addArticleCorrected} // Use the corrected function
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add to Queue
                        </button>
                        <button
                          onClick={() => setShowAddArticle(false)}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {articles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No articles added yet. Click "Add Article" to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-6">
                      {articles.map((article, index) => {
                        // Find the client object for the current article
                        const articleClient = clients.find((c) => c.id === article.clientId)
                        const articleForm = article.form || article.contentForm // Use 'form' if available, otherwise 'contentForm'

                        return (
                          <div
                            key={article.id}
                            className={`border rounded-lg transition-all ${
                              article.status === "processing"
                                ? "border-blue-500 bg-blue-50"
                                : article.status === "approved"
                                  ? "border-green-500 bg-green-50"
                                  : article.status === "form-generated"
                                    ? "border-gray-400 bg-gray-50"
                                    : article.status === "complete"
                                      ? "border-gray-300 bg-white"
                                      : "border-gray-200 bg-white"
                            }`}
                          >
                            {/* Article Header */}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  {articleClient && <span className="text-2xl">{articleClient.logo}</span>}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{article.title}</h4>
                                    <p className="text-sm text-gray-500">{articleForm.currentUrl}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Status Badge */}
                                  <div
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      article.status === "complete"
                                        ? "bg-white border border-gray-300 text-gray-700"
                                        : article.status === "approved"
                                          ? "bg-white border border-green-500 text-green-700"
                                          : article.status === "processing"
                                            ? "bg-white border border-blue-500 text-blue-700"
                                            : article.status === "form-generated"
                                              ? "bg-white border border-gray-400 text-gray-700"
                                              : "bg-white border border-gray-300 text-gray-600"
                                    }`}
                                  >
                                    {article.status === "complete" && (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        Complete
                                      </span>
                                    )}
                                    {article.status === "approved" && (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        Approved
                                      </span>
                                    )}
                                    {article.status === "processing" && (
                                      <span className="flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Processing
                                      </span>
                                    )}
                                    {article.status === "form-generated" && "Form Generated"}
                                    {article.status === "pending" && "Pending"}
                                  </div>

                                  {/* Progress */}
                                  <div className="text-sm text-gray-600">
                                    {article.steps.filter((s) => s.status === "complete").length}/{article.steps.length}
                                  </div>

                                  {/* Action Buttons */}
                                  {article.status === "form-generated" && (
                                    <>
                                      <button
                                        onClick={() => setEditingArticleId(article.id)}
                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Form"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => approveArticle(article.id)}
                                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Approve"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}

                                  {/* Expand/Collapse Button */}
                                  <button
                                    onClick={() => toggleArticleExpansion(article.id)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    {article.expanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>

                                  {/* Remove Button */}
                                  {article.status !== "processing" && (
                                    <button
                                      onClick={() => removeArticle(article.id)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    article.status === "complete"
                                      ? "bg-green-600"
                                      : article.status === "approved" || article.status === "processing"
                                        ? "bg-blue-600"
                                        : "bg-gray-400"
                                  }`}
                                  style={{
                                    width: `${(article.steps.filter((s) => s.status === "complete").length / article.steps.length) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {article.expanded && (
                              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-2">
                                {article.steps.map((step) => (
                                  <div
                                    key={step.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${
                                      step.status === "complete"
                                        ? "bg-white border border-gray-200"
                                        : step.status === "running"
                                          ? "bg-blue-50 border border-blue-200"
                                          : "bg-white border border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {step.status === "complete" && (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                      )}
                                      {step.status === "running" && (
                                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                      )}
                                      {step.status === "pending" && <Circle className="w-5 h-5 text-gray-400" />}
                                      <span
                                        className={`font-medium ${
                                          step.status === "complete"
                                            ? "text-gray-900"
                                            : step.status === "running"
                                              ? "text-blue-700"
                                              : "text-gray-500"
                                        }`}
                                      >
                                        {step.title}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xs font-medium px-2 py-1 rounded ${
                                        step.status === "complete"
                                          ? "bg-gray-100 text-gray-700"
                                          : step.status === "running"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-500"
                                      }`}
                                    >
                                      {step.status === "complete"
                                        ? "Complete"
                                        : step.status === "running"
                                          ? "Running"
                                          : "Pending"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {editingArticleId === article.id && (
                              <div className="border-t border-gray-200 p-4 bg-white space-y-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Edit Content Order Form</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current URL</label>
                                    <input
                                      type="url"
                                      value={articleForm.currentUrl}
                                      onChange={(e) =>
                                        updateArticleForm(article.id, {
                                          ...articleForm,
                                          currentUrl: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Business Name
                                    </label>
                                    <input
                                      type="text"
                                      value={articleForm.businessName}
                                      onChange={(e) =>
                                        updateArticleForm(article.id, { ...articleForm, businessName: e.target.value })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
                                    <input
                                      type="text"
                                      value={articleForm.niche}
                                      onChange={(e) =>
                                        updateArticleForm(article.id, { ...articleForm, niche: e.target.value })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                                    <input
                                      type="text"
                                      value={articleForm.keywords.join(", ")}
                                      onChange={(e) =>
                                        updateArticleForm(article.id, { ...articleForm, keywords: e.target.value })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setEditingArticleId(null)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    Save Changes
                                  </button>
                                  <button
                                    onClick={() => setEditingArticleId(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Batch Progress Summary */}
                {articles.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Progress</h3>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{articles.length}</div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-600">
                          {articles.filter((a) => a.status === "pending").length}
                        </div>
                        <div className="text-sm text-gray-600">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {articles.filter((a) => a.status === "form-generated").length}
                        </div>
                        <div className="text-sm text-gray-600">Forms Ready</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {articles.filter((a) => a.status === "approved").length}
                        </div>
                        <div className="text-sm text-gray-600">Approved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {articles.filter((a) => a.status === "complete").length}
                        </div>
                        <div className="text-sm text-gray-600">Complete</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Single Article Mode
              <div className="space-y-8">
                {/* Steps */}
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`border-l-4 ${getStatusColor(
                        step.status,
                      )} rounded-r-lg transition-all duration-500 hover:shadow-md`}
                    >
                      {/* Step Header */}
                      <div
                        className={`flex items-center justify-between px-4 cursor-pointer hover:bg-gray-50/50 transition-all duration-300 ${
                          step.expanded ? "py-3" : "py-2.5"
                        }`}
                        onClick={() => toggleStep(step.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="animate-in fade-in zoom-in duration-300">{getStatusIcon(step.status)}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tracking-tight text-gray-900">
                              {index + 1}. {step.title}
                            </span>
                            {step.id === "order-form" && <FileText className="h-3.5 w-3.5 text-blue-600" />}
                            {step.id === "research" && <Search className="h-3.5 w-3.5 text-blue-600" />}
                            {step.id === "outline" && <Lightbulb className="h-3.5 w-3.5 text-blue-600" />}
                            {step.id === "content" && <BookOpen className="h-3.5 w-3.5 text-blue-600" />}
                            {step.id === "analysis" && <BarChart3 className="h-3.5 w-3.5 text-blue-600" />}
                            {step.id === "review" && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-xs hover:bg-blue-50 text-blue-600 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              viewPrompt(step.id)
                            }}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {step.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-3 text-xs hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation()
                                runStepWrapper(step.id) // Use wrapper
                              }}
                              disabled={step.id === "order-form" && !selectedClient}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Run
                            </Button>
                          )}
                          {step.expanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-500 transition-transform duration-300" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-300" />
                          )}
                        </div>
                      </div>

                      {/* Step Content */}
                      {step.expanded && (
                        <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                          {step.id === "order-form" && (
                            <div className="space-y-4">
                              {step.status === "pending" && (
                                <div className="space-y-4">
                                  <div className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-lg">
                                    <p className="text-sm text-gray-700 flex items-center gap-2 mb-3">
                                      <Sparkles className="h-4 w-4 text-blue-600" />
                                      Fill out the fields below, then click "Generate Form" to create a comprehensive content order form.
                                    </p>
                                  </div>

                                  {/* Pre-run form */}
                                  <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                          Required
                                        </span>
                                        Current URL / Page
                                      </label>
                                      <p className="text-xs text-gray-500 mb-2">Select the page this content will be published on</p>
                                      <select
                                        value={contentForm.currentUrl}
                                        onChange={(e) => setContentForm({ ...contentForm, currentUrl: e.target.value })}
                                        className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                                      >
                                        <option value="">Select a URL...</option>
                                        {selectedClient?.ownUrls.map((urlItem, idx) => (
                                          <option key={idx} value={urlItem.url}>
                                            {urlItem.name} - {urlItem.url}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                          Important
                                        </span>
                                        Primary Keyword
                                      </label>
                                      <p className="text-xs text-gray-500 mb-2">The main keyword this content should rank for</p>
                                      <input
                                        type="text"
                                        value={primaryKeyword}
                                        onChange={(e) => setPrimaryKeyword(e.target.value)}
                                        placeholder="e.g., local SEO services, mental health counseling"
                                        className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                          Important
                                        </span>
                                        Content Description / What Client Wants
                                      </label>
                                      <p className="text-xs text-gray-500 mb-2">Describe what the client is looking for or what this content should be about</p>
                                      <Textarea
                                        value={contentDescription}
                                        onChange={(e) => setContentDescription(e.target.value)}
                                        placeholder="e.g., A comprehensive guide explaining the benefits of our mental health services for families in the Tampa area, with a focus on accessibility and affordability"
                                        className="min-h-[100px] text-sm"
                                      />
                                    </div>

                                    <div className="pt-2">
                                      <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => runStepWrapper(step.id)}
                                        disabled={!selectedClient || !contentForm.currentUrl}
                                      >
                                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                        Generate Form {!contentForm.currentUrl && '(Select URL first)'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {step.status === "running" && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-blue-600 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm font-medium">
                                      Analyzing client website and generating form...
                                    </span>
                                  </div>
                                  <div className="space-y-2 animate-pulse">
                                    <div className="h-10 bg-gray-100 rounded"></div>
                                    <div className="h-10 bg-gray-100 rounded"></div>
                                    <div className="h-20 bg-gray-100 rounded"></div>
                                  </div>
                                </div>
                              )}

                              {step.status === "complete" && (
                                <div className="space-y-4">
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                                    <Check className="h-5 w-5" />
                                    <span className="font-semibold text-sm">
                                      Content Order Form Generated Successfully!
                                    </span>
                                  </div>

                                  {/* Form Fields */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                        <Globe className="h-3.5 w-3.5 text-blue-600" />
                                        Current URL
                                      </label>
                                      <select
                                        value={contentForm.currentUrl}
                                        onChange={(e) => setContentForm({ ...contentForm, currentUrl: e.target.value })}
                                        className="w-full h-9 text-sm border border-gray-300 rounded-md px-3 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                      >
                                        <option value="">Select a URL...</option>
                                        {selectedClient?.ownUrls.map((urlItem, idx) => (
                                          <option key={idx} value={urlItem.url}>
                                            {urlItem.name} - {urlItem.url}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                                        Business/Company Name
                                      </label>
                                      <Input
                                        value={contentForm.businessName}
                                        onChange={(e) =>
                                          setContentForm({ ...contentForm, businessName: e.target.value })
                                        }
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5 text-blue-600" />
                                        Niche
                                      </span>
                                      {selectedClient?.defaultFormValues?.niche && (
                                        <button
                                          type="button"
                                          onClick={() => setContentForm({ ...contentForm, niche: selectedClient.defaultFormValues.niche })}
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                          title={`Use default: ${selectedClient.defaultFormValues.niche}`}
                                        >
                                          <RotateCcw className="h-3 w-3" />
                                          Use Default
                                        </button>
                                      )}
                                    </label>
                                    <Input
                                      value={contentForm.niche}
                                      onChange={(e) => setContentForm({ ...contentForm, niche: e.target.value })}
                                      className="h-9 text-sm"
                                      placeholder="e.g., Healthcare → Behavioral Health → Outpatient Counseling"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <Target className="h-3.5 w-3.5 text-blue-600" />
                                        Intended Result of the Page
                                      </span>
                                      {selectedClient?.defaultFormValues?.intendedResult && (
                                        <button
                                          type="button"
                                          onClick={() => setContentForm({ ...contentForm, intendedResult: selectedClient.defaultFormValues.intendedResult })}
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                          title={`Use default: ${selectedClient.defaultFormValues.intendedResult}`}
                                        >
                                          <RotateCcw className="h-3 w-3" />
                                          Use Default
                                        </button>
                                      )}
                                    </label>
                                    <Textarea
                                      value={contentForm.intendedResult}
                                      onChange={(e) =>
                                        setContentForm({ ...contentForm, intendedResult: e.target.value })
                                      }
                                      className="min-h-[60px] text-sm"
                                      placeholder="Primary CTA"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-gray-700 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                          <Users className="h-3.5 w-3.5 text-blue-600" />
                                          Target Audience
                                        </span>
                                        {selectedClient?.defaultFormValues?.targetAudience && (
                                          <button
                                            type="button"
                                            onClick={() => setContentForm({ ...contentForm, targetAudience: selectedClient.defaultFormValues.targetAudience })}
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                            title={`Use default: ${selectedClient.defaultFormValues.targetAudience}`}
                                          >
                                            <RotateCcw className="h-3 w-3" />
                                            Use Default
                                          </button>
                                        )}
                                      </label>
                                      <Textarea
                                        value={contentForm.targetAudience}
                                        onChange={(e) =>
                                          setContentForm({ ...contentForm, targetAudience: e.target.value })
                                        }
                                        className="min-h-[60px] text-sm"
                                      />
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-gray-700 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                          <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                          Geographical Locations
                                        </span>
                                        {selectedClient?.defaultFormValues?.geoLocations && (
                                          <button
                                            type="button"
                                            onClick={() => setContentForm({ ...contentForm, geoLocations: selectedClient.defaultFormValues.geoLocations })}
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                            title={`Use default: ${selectedClient.defaultFormValues.geoLocations}`}
                                          >
                                            <RotateCcw className="h-3 w-3" />
                                            Use Default
                                          </button>
                                        )}
                                      </label>
                                      <Textarea
                                        value={contentForm.geoLocations}
                                        onChange={(e) =>
                                          setContentForm({ ...contentForm, geoLocations: e.target.value })
                                        }
                                        className="min-h-[60px] text-sm"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700 flex items-center justify-between">
                                      <span>Relevant Keywords</span>
                                      {selectedClient?.defaultFormValues?.keywords && selectedClient.defaultFormValues.keywords.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setContentForm({ ...contentForm, keywords: selectedClient.defaultFormValues.keywords })}
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                          title={`Use default: ${selectedClient.defaultFormValues.keywords.join(', ')}`}
                                        >
                                          <RotateCcw className="h-3 w-3" />
                                          Use Default
                                        </button>
                                      )}
                                    </label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                                      {contentForm.keywords.map((keyword, idx) => (
                                        <span
                                          key={idx}
                                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                                        >
                                          {keyword}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700 flex items-center justify-between">
                                      <span>Additional Instructions for Writers</span>
                                      {selectedClient?.defaultFormValues?.additionalInstructions && (
                                        <button
                                          type="button"
                                          onClick={() => setContentForm({ ...contentForm, additionalInstructions: selectedClient.defaultFormValues.additionalInstructions })}
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                          title={`Use default: ${selectedClient.defaultFormValues.additionalInstructions}`}
                                        >
                                          <RotateCcw className="h-3 w-3" />
                                          Use Default
                                        </button>
                                      )}
                                    </label>
                                    <Textarea
                                      value={contentForm.additionalInstructions}
                                      onChange={(e) =>
                                        setContentForm({ ...contentForm, additionalInstructions: e.target.value })
                                      }
                                      className="min-h-[80px] text-sm"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700 flex items-center justify-between">
                                      <span>Competitors to Review</span>
                                      {selectedClient?.defaultFormValues?.competitors && selectedClient.defaultFormValues.competitors.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setContentForm({ ...contentForm, competitors: selectedClient.defaultFormValues.competitors })}
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                          title={`Use default: ${selectedClient.defaultFormValues.competitors.join(', ')}`}
                                        >
                                          <RotateCcw className="h-3 w-3" />
                                          Use Default
                                        </button>
                                      )}
                                    </label>
                                    <div className="space-y-2">
                                      {contentForm.competitors.map((competitor, idx) => (
                                        <div
                                          key={idx}
                                          className="p-2 bg-gray-50 border border-gray-200 rounded text-sm"
                                        >
                                          {competitor}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium text-gray-900">
                                        Include Key Points Summary
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Add bulleted summary at the top of the page
                                      </div>
                                    </div>
                                    <div
                                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${contentForm.includeKeyPoints ? "bg-green-500" : "bg-gray-300"} relative cursor-pointer`}
                                      onClick={() =>
                                        setContentForm({
                                          ...contentForm,
                                          includeKeyPoints: !contentForm.includeKeyPoints,
                                        })
                                      }
                                    >
                                      <div
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${contentForm.includeKeyPoints ? "translate-x-6" : ""}`}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-900">Page Content Preference</label>
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => setContentForm({ ...contentForm, contentPreference: "create" })}
                                        className={`flex-1 p-3 border-2 rounded-lg transition-all duration-200 ${
                                          contentForm.contentPreference === "create"
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                      >
                                        <div className="text-sm font-medium text-gray-900">Create from scratch</div>
                                        <div className="text-xs text-gray-500 mt-1">Generate entirely new content</div>
                                      </button>
                                      <button
                                        onClick={() => setContentForm({ ...contentForm, contentPreference: "enhance" })}
                                        className={`flex-1 p-3 border-2 rounded-lg transition-all duration-200 ${
                                          contentForm.contentPreference === "enhance"
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                      >
                                        <div className="text-sm font-medium text-gray-900">Enhance existing</div>
                                        <div className="text-xs text-gray-500 mt-1">Improve current content</div>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {step.id === "research" && (
                            <div className="space-y-4">
                              {step.status === "pending" && (
                                <div className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg">
                                  <p className="text-sm text-gray-600 italic flex items-center gap-2">
                                    <Search className="h-4 w-4 text-blue-600" />
                                    Ready to search the web for relevant information. Click "Run" to start research with
                                    Perplexity AI.
                                  </p>
                                </div>
                              )}

                              {step.status === "running" && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-blue-600 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm font-medium">
                                      Searching web sources with Perplexity AI...
                                    </span>
                                  </div>
                                  <div className="p-4 bg-white border border-gray-200 rounded-lg animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded mb-3"></div>
                                    <div className="h-4 bg-gray-100 rounded mb-3"></div>
                                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                  </div>
                                </div>
                              )}

                              {step.status === "complete" && (
                                <div className="space-y-4">
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                                    <Check className="h-5 w-5" />
                                    <span className="font-semibold text-sm">Research Complete - Found 8 sources</span>
                                  </div>

                                  <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                                    <div className="prose prose-sm max-w-none">
                                      <div
                                        className="text-sm text-gray-800 leading-relaxed space-y-3"
                                        dangerouslySetInnerHTML={{
                                          __html: researchResponse
                                            .replace(/^# /gm, '<h1 class="text-lg font-bold text-gray-900 mb-2">')
                                            .replace(/\n/g, "</h1>")
                                            .replace(
                                              /^## /gm,
                                              '<h2 class="text-base font-semibold text-gray-900 mt-4 mb-2">',
                                            )
                                            .replace(
                                              /\*\*(.*?)\*\*/g,
                                              '<strong class="font-semibold text-gray-900">$1</strong>',
                                            )
                                            .replace(/^(\d+)\. /gm, '<div class="ml-4">$1. ')
                                            .replace(/^- /gm, '<div class="ml-4">• '),
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <BookOpen className="h-4 w-4 text-blue-600" />
                                      Sources & Citations ({citations.length})
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                      {citations.map((citation, idx) => (
                                        <div
                                          key={idx}
                                          className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                                          style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                          <div className="flex items-start gap-3">
                                            <img
                                              src={citation.favicon || "/placeholder.svg"}
                                              alt=""
                                              className="w-5 h-5 mt-0.5 flex-shrink-0"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none"
                                              }}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="text-sm font-semibold text-blue-600 hover:underline truncate">
                                                {citation.title}
                                              </div>
                                              <div className="text-xs text-green-700 truncate mt-0.5">
                                                {citation.url}
                                              </div>
                                              <div className="text-xs text-gray-600 mt-2 leading-relaxed">
                                                {citation.snippet}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Step 3: Outline */}
                          {step.id === "outline" && (
                            <div className="space-y-3">
                              {step.status === "pending" && (
                                <div className="space-y-2">
                                  <div className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-lg">
                                    <p className="text-sm text-gray-600 italic flex items-center gap-2">
                                      <Lightbulb className="h-4 w-4 text-amber-600" />
                                      AI will generate a structured outline based on research. You'll be able to edit it
                                      before generating content.
                                    </p>
                                  </div>
                                  <div className="text-xs font-medium text-gray-600 mb-2">Preview structure:</div>
                                  <div className="space-y-1 opacity-50">
                                    {outline.slice(0, 3).map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded"
                                        style={{ paddingLeft: `${item.level * 12}px` }}
                                      >
                                        <span className="text-sm">{item.text}</span>
                                      </div>
                                    ))}
                                    <div className="text-xs text-gray-400 text-center py-2">+ more sections...</div>
                                  </div>
                                </div>
                              )}

                              {step.status === "running" && (
                                <div className="text-sm text-gray-700 p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-xs font-medium">Generating outline structure...</span>
                                  </div>
                                  <div className="space-y-1 animate-in fade-in duration-500">
                                    {outline.slice(0, 2).map((item) => (
                                      <div key={item.id} className="text-sm text-gray-600">
                                        • {item.text}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {step.status === "complete" && (
                                <>
                                  <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                                    <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                                    Edit outline before generating content:
                                  </div>
                                  <div className="space-y-1.5">
                                    {outline.map((item, idx) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 group animate-in fade-in slide-in-from-left-2"
                                        style={{ paddingLeft: `${item.level * 12}px`, animationDelay: `${idx * 50}ms` }}
                                      >
                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move hover:text-gray-600 transition-colors" />
                                        <span className="text-sm flex-1 font-medium">{item.text}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-gray-100"
                                            onClick={() => moveOutlineItem(item.id, "up")}
                                            disabled={idx === 0}
                                          >
                                            <ChevronUp className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-gray-100"
                                            onClick={() => moveOutlineItem(item.id, "down")}
                                            disabled={idx === outline.length - 1}
                                          >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-100">
                                            <Edit2 className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                                            onClick={() => deleteOutlineItem(item.id)}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs hover:bg-gray-100 transition-all duration-200"
                                    onClick={addOutlineItem}
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Add Section
                                  </Button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Step 4: Content */}
                          {step.id === "content" && (
                            <div className="space-y-3">
                              {step.status === "pending" && (
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-lg space-y-2">
                                  <p className="text-sm text-gray-600 italic flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-purple-600" />
                                    AI will generate complete, SEO-optimized blog content based on your outline and
                                    research.
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-purple-100">
                                    <span>• Full markdown formatting</span>
                                    <span>• SEO optimized</span>
                                    <span>• ~2,500 words</span>
                                  </div>
                                </div>
                              )}

                              {step.status === "running" && (
                                <div className="text-sm text-gray-700 space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-2 text-purple-600 mb-3">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-xs font-medium">Generating content...</span>
                                  </div>
                                  <div className="space-y-2 animate-in fade-in duration-300">
                                    <p className="font-bold text-lg"># Introduction to Content Marketing</p>
                                    <p className="leading-relaxed">
                                      Content marketing has become an essential strategy for businesses looking to
                                      engage their audience and build lasting relationships. In today's digital
                                      landscape...
                                    </p>
                                    <p className="leading-relaxed animate-in fade-in duration-300 delay-150">
                                      By focusing on value delivery and authentic storytelling, brands can create
                                      meaningful connections that drive long-term success...
                                    </p>
                                    <div className="inline-flex items-center gap-2 mt-2">
                                      <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 animate-pulse" />
                                      <span className="text-xs text-gray-400">Writing in progress...</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {step.status === "complete" && (
                                <div className="space-y-3">
                                  <div className="p-4 bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700 mb-2">
                                      <Check className="h-5 w-5" />
                                      <span className="font-semibold">Content Generation Complete!</span>
                                    </div>
                                    <div className="text-sm text-gray-700 space-y-1">
                                      <p>✓ Full blog post generated successfully</p>
                                      <p>✓ 2,847 words with proper formatting</p>
                                      <p>✓ SEO optimized with focus keyword integration</p>
                                      <p>✓ Citations and sources included</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                                      Preview Content
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 hover:bg-gray-100 transition-all duration-200 bg-transparent"
                                    >
                                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                                      Edit Content
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 hover:bg-blue-50 transition-all duration-200 bg-transparent border-blue-300 text-blue-700"
                                      onClick={() => {
                                        // Store content and navigate to doc editor
                                        const docTitle = `${contentForm.businessName} - ${contentForm.niche} Blog Post`;
                                        localStorage.setItem('newDocContent', generatedContent);
                                        localStorage.setItem('newDocTitle', docTitle);
                                        window.location.href = '/chat-doc';
                                      }}
                                    >
                                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                                      Export to Doc Editor
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {step.id === "analysis" && (
                            <div className="space-y-4">
                              {step.status === "pending" && (
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-lg">
                                  <p className="text-sm text-gray-700 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-purple-600" />
                                    Analyze content programmatically for word count, readability, frequency, and other
                                    metrics.
                                  </p>
                                </div>
                              )}

                              {step.status === "running" && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-blue-600 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm font-medium">Analyzing content metrics...</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3 animate-pulse">
                                    <div className="h-24 bg-gray-100 rounded-lg"></div>
                                    <div className="h-24 bg-gray-100 rounded-lg"></div>
                                    <div className="h-24 bg-gray-100 rounded-lg"></div>
                                  </div>
                                </div>
                              )}

                              {step.status === "complete" && (
                                <div className="space-y-4">
                                  <div className="p-3 bg-white border-l-4 border-l-green-500 border border-gray-200 rounded-lg flex items-center gap-2 text-gray-900">
                                    <Check className="h-5 w-5 text-green-600" />
                                    <span className="font-semibold text-sm">Analysis Complete</span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="p-4 bg-white border-2 border-blue-500 rounded-lg hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                                      <div className="text-3xl font-bold text-gray-900">
                                        {analysisResults.wordCount}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">Total Words</div>
                                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        {analysisResults.wordCount >= 2000 ? (
                                          <>
                                            <Check className="h-3 w-3 text-green-600" /> Optimal length
                                          </>
                                        ) : (
                                          "Consider adding more"
                                        )}
                                      </div>
                                    </div>

                                    <div className="p-4 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-75">
                                      <div className="text-3xl font-bold text-gray-900">
                                        {analysisResults.readabilityScore}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">Readability Score</div>
                                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        {analysisResults.readabilityScore >= 60 ? (
                                          <>
                                            <Check className="h-3 w-3 text-green-600" /> Easy to read
                                          </>
                                        ) : (
                                          "Simplify language"
                                        )}
                                      </div>
                                    </div>

                                    <div className="p-4 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-150">
                                      <div className="text-3xl font-bold text-gray-900">
                                        {analysisResults.keywordFrequency}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">Keyword Mentions</div>
                                      <div className="text-xs text-gray-500 mt-2">
                                        Focus: "{contentForm.keywords[0] || "N/A"}"
                                      </div>
                                    </div>

                                    <div className="p-4 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-200">
                                      <div className="text-3xl font-bold text-gray-900">
                                        {analysisResults.avgSentenceLength}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">Avg Sentence Length</div>
                                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        {analysisResults.avgSentenceLength <= 20 ? (
                                          <>
                                            <Check className="h-3 w-3 text-green-600" /> Good flow
                                          </>
                                        ) : (
                                          "Break up long sentences"
                                        )}
                                      </div>
                                    </div>

                                    <div className="p-4 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-300">
                                      <div className="text-3xl font-bold text-gray-900">
                                        {analysisResults.paragraphCount}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">Paragraphs</div>
                                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        {analysisResults.paragraphCount >= 10 ? (
                                          <>
                                            <Check className="h-3 w-3 text-green-600" /> Well structured
                                          </>
                                        ) : (
                                          "Add more breaks"
                                        )}
                                      </div>
                                    </div>

                                    <div className="p-4 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-400">
                                      <div className="text-3xl font-bold text-gray-900">
                                        {analysisResults.headingCount}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">Headings</div>
                                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        {analysisResults.headingCount >= 6 ? (
                                          <>
                                            <Check className="h-3 w-3 text-green-600" /> Good structure
                                          </>
                                        ) : (
                                          "Add more sections"
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg">
                                    <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <Lightbulb className="h-4 w-4 text-blue-600" />
                                      Optimization Recommendations
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-700">
                                      <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                        <span>
                                          Keyword density:{" "}
                                          {(
                                            (analysisResults.keywordFrequency / analysisResults.wordCount) *
                                            100
                                          ).toFixed(2)}
                                          %
                                          {(analysisResults.keywordFrequency / analysisResults.wordCount) * 100 < 1
                                            ? " - Consider adding more keyword variations"
                                            : " - Good balance"}
                                        </span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                        <span>
                                          Content is{" "}
                                          {analysisResults.readabilityScore >= 60
                                            ? "easily readable"
                                            : "moderately complex"}{" "}
                                          for target audience
                                        </span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                        <span>
                                          Average{" "}
                                          {Math.round(analysisResults.wordCount / analysisResults.paragraphCount)} words
                                          per paragraph -{" "}
                                          {Math.round(analysisResults.wordCount / analysisResults.paragraphCount) <= 150
                                            ? "optimal"
                                            : "consider breaking up"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {step.id === "review" && (
                            <div className="space-y-4">
                              {step.status === "pending" && (
                                <div className="space-y-3">
                                  <div className="p-4 bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-lg">
                                    <p className="text-sm text-gray-700 flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      Review content against topic, keyword, and HOTH requirements. Add custom check
                                      criteria below.
                                    </p>
                                  </div>

                                  <div className="space-y-3 p-4 bg-white border-2 border-gray-200 rounded-lg">
                                    <div className="text-sm font-semibold text-gray-900 mb-3">Review Criteria</div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">Topic</label>
                                        <Input
                                          value={reviewTopic}
                                          onChange={(e) => setReviewTopic(e.target.value)}
                                          placeholder="e.g., Mental Health Counseling"
                                          className="h-9 text-sm bg-gray-50"
                                        />
                                      </div>

                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">Focus Keyword</label>
                                        <Input
                                          value={reviewKeyword}
                                          onChange={(e) => setReviewKeyword(e.target.value)}
                                          placeholder="e.g., counseling services"
                                          className="h-9 text-sm bg-gray-50"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-gray-700">
                                        Additional Check Criteria (Optional)
                                      </label>
                                      <Textarea
                                        value={additionalCheckCriteria}
                                        onChange={(e) => setAdditionalCheckCriteria(e.target.value)}
                                        placeholder="Add any specific requirements to check for (e.g., 'Ensure local Seattle references', 'Include patient testimonials', 'Verify all CTAs are present')..."
                                        className="min-h-[80px] text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {step.status === "running" && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm font-medium">Reviewing content against criteria...</span>
                                  </div>
                                  <div className="p-4 bg-white border border-gray-200 rounded-lg animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded mb-3"></div>
                                    <div className="h-4 bg-gray-100 rounded mb-3"></div>
                                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                  </div>
                                </div>
                              )}

                              {step.status === "complete" && (
                                <div className="space-y-4">
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                                    <Check className="h-5 w-5" />
                                    <span className="font-semibold text-sm">
                                      Review Complete - {suggestedEdits.length} Suggestions Found
                                    </span>
                                  </div>

                                  <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                                    <div className="prose prose-sm max-w-none">
                                      <div className="text-sm text-gray-800 leading-relaxed space-y-3 whitespace-pre-wrap">
                                        {reviewResponse}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <Zap className="h-4 w-4 text-blue-600" />
                                      Suggested Edits ({suggestedEdits.length})
                                    </div>
                                    <div className="space-y-2">
                                      {suggestedEdits.map((edit, idx) => (
                                        <div
                                          key={idx}
                                          className="p-4 bg-white border-l-4 border-l-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-left-2"
                                          style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                              {idx + 1}
                                            </div>
                                            <div className="flex-1 text-sm text-gray-700 leading-relaxed">{edit}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    <Button
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                                      onClick={executeEdits}
                                    >
                                      <Zap className="h-4 w-4 mr-2" />
                                      Execute All Edits
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span>
                      {steps.filter((s) => s.status === "complete").length} / {steps.length} steps complete
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                      style={{
                        width: `${(steps.filter((s) => s.status === "complete").length / steps.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Main Content Area (65%) */}
        <div className="w-[65%] bg-gray-50 overflow-y-auto p-6">
          <div className="max-w-4xl">
            {!selectedClient ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 p-12">
                  <div className="inline-flex p-4 bg-gray-100 rounded-full">
                    <Sparkles className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700">Select a client to get started</h3>
                  <p className="text-gray-500">Choose a client from the dropdown to begin generating content</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{selectedClient.logo}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                      <a href={selectedClient.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        {selectedClient.url}
                      </a>
                    </div>
                  </div>
                  {selectedClient.bio && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                      <p className="text-sm text-gray-600">{selectedClient.bio}</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Progress</h3>
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(step.status)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{step.title}</div>
                          <div className="text-xs text-gray-500 capitalize">{step.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Bio Modal */}
      {showClientBio && selectedClient && (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={() => {
              setShowClientBio(false)
              setEditingBio(false)
              setEditingDefaults(false) // Close editing defaults as well
              setClientBioTab("bio") // Reset tab to bio
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedClient.logo}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                    <p className="text-sm text-gray-500">{selectedClient.url}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowClientBio(false)
                    setEditingBio(false)
                    setEditingDefaults(false)
                    setClientBioTab("bio")
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setClientBioTab("bio")}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                    clientBioTab === "bio"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Client Information
                </button>
                <button
                  onClick={() => setClientBioTab("defaults")}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                    clientBioTab === "defaults"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Default Form Values
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {clientBioTab === "bio" ? (
                  // Existing bio content
                  <div className="space-y-6">
                    {/* Client Bio Section */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        Client Bio
                      </label>
                      {editingBio ? (
                        <Textarea
                          value={bioText}
                          onChange={(e) => setBioText(e.target.value)}
                          className="min-h-[120px] text-sm"
                          placeholder="Describe the client's business, services, and unique value proposition..."
                        />
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                          {bioText}
                        </div>
                      )}
                    </div>

                    {/* Things to Avoid Section */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Things to Avoid
                      </label>
                      {editingBio ? (
                        <Textarea
                          value={thingsToAvoid}
                          onChange={(e) => setThingsToAvoid(e.target.value)}
                          className="min-h-[100px] text-sm"
                          placeholder="List topics, phrases, or approaches to avoid in content..."
                        />
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                          {thingsToAvoid}
                        </div>
                      )}
                    </div>

                    {/* Competitors Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          Competitors ({competitors.length})
                        </label>
                        {editingBio && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-transparent"
                            onClick={addCompetitor}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Competitor
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {competitors.length === 0 ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 text-center italic">
                            No competitors added yet
                          </div>
                        ) : (
                          competitors.map((competitor, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                            >
                              {editingBio ? (
                                <>
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <Input
                                      value={competitor.name}
                                      onChange={(e) => updateCompetitor(index, "name", e.target.value)}
                                      placeholder="Competitor name"
                                      className="h-8 text-sm"
                                    />
                                    <Input
                                      value={competitor.url}
                                      onChange={(e) => updateCompetitor(index, "url", e.target.value)}
                                      placeholder="https://..."
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                    onClick={() => removeCompetitor(index)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">{competitor.name}</div>
                                  <div className="text-xs text-blue-600 hover:underline">
                                    <a href={competitor.url} target="_blank" rel="noopener noreferrer">
                                      {competitor.url}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* My Own URLs Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          My Own URLs ({ownUrls.length})
                        </label>
                        {editingBio && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs bg-transparent"
                              onClick={() => setShowBulkUrlInput(!showBulkUrlInput)}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Bulk Add
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs bg-transparent"
                              onClick={addOwnUrl}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add URL
                            </Button>
                          </div>
                        )}
                      </div>

                      {showBulkUrlInput && editingBio && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="text-xs text-gray-600 mb-2">
                            Paste URLs (one per line). Format:{" "}
                            <code className="bg-white px-1 py-0.5 rounded">Name, URL</code> or just URL
                          </div>
                          <Textarea
                            value={bulkUrlInput}
                            onChange={(e) => setBulkUrlInput(e.target.value)}
                            placeholder="About Us, https://example.com/about&#10;Services, https://example.com/services&#10;https://example.com/contact"
                            className="min-h-[100px] text-sm font-mono"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={handleBulkUrlPaste}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Add URLs
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowBulkUrlInput(false)
                                setBulkUrlInput("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {ownUrls.length === 0 ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 text-center italic">
                            No URLs added yet
                          </div>
                        ) : (
                          ownUrls.map((urlItem, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                            >
                              {editingBio ? (
                                <>
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <Input
                                      value={urlItem.name}
                                      onChange={(e) => updateOwnUrl(index, "name", e.target.value)}
                                      placeholder="Page name"
                                      className="h-8 text-sm"
                                    />
                                    <Input
                                      value={urlItem.url}
                                      onChange={(e) => updateOwnUrl(index, "url", e.target.value)}
                                      placeholder="https://..."
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                    onClick={() => removeOwnUrl(index)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">{urlItem.name}</div>
                                  <div className="text-xs text-blue-600 hover:underline">
                                    <a href={urlItem.url} target="_blank" rel="noopener noreferrer">
                                      {urlItem.url}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          Locations ({locations.length})
                        </label>
                        {editingBio && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-transparent"
                            onClick={addLocation}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Location
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {locations.length === 0 ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 text-center italic">
                            No locations added yet
                          </div>
                        ) : (
                          locations.map((location, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                            >
                              {editingBio ? (
                                <>
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <Input
                                      value={location.title}
                                      onChange={(e) => updateLocation(index, "title", e.target.value)}
                                      placeholder="Location title"
                                      className="h-8 text-sm"
                                    />
                                    <Input
                                      value={location.address}
                                      onChange={(e) => updateLocation(index, "address", e.target.value)}
                                      placeholder="Full address"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                    onClick={() => removeLocation(index)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">{location.title}</div>
                                  <div className="text-xs text-gray-600">{location.address}</div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-blue-600" />
                          Social & Other Links ({socialLinks.length})
                        </label>
                        {editingBio && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-transparent"
                            onClick={addSocialLink}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Link
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {socialLinks.length === 0 ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 text-center italic">
                            No social links added yet
                          </div>
                        ) : (
                          socialLinks.map((link, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                            >
                              {editingBio ? (
                                <>
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <Input
                                      value={link.label}
                                      onChange={(e) => updateSocialLink(index, "label", e.target.value)}
                                      placeholder="Platform name (e.g., Facebook)"
                                      className="h-8 text-sm"
                                    />
                                    <Input
                                      value={link.url}
                                      onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                                      placeholder="https://..."
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                    onClick={() => removeSocialLink(index)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">{link.label}</div>
                                  <div className="text-xs text-blue-600 hover:underline">
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                      {link.url}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Default Form Values</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          These values will auto-populate when creating new content for this client
                        </p>
                      </div>
                      {!editingDefaults ? (
                        <Button
                          onClick={() => {
                            setEditingDefaults(true)
                            // Ensure tempDefaultForm is initialized correctly from selectedClient.defaultFormValues
                            if (selectedClient) {
                              setTempDefaultForm({ ...selectedClient.defaultFormValues })
                            }
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Defaults
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingDefaults(false)
                              setTempDefaultForm(null)
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSaveDefaultForm} size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Save className="h-4 w-4 mr-2" />
                            Save Defaults
                          </Button>
                        </div>
                      )}
                    </div>

                    {editingDefaults && tempDefaultForm ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Business Name</label>
                          <input
                            type="text"
                            value={tempDefaultForm.businessName}
                            onChange={(e) => setTempDefaultForm({ ...tempDefaultForm, businessName: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Niche</label>
                          <input
                            type="text"
                            value={tempDefaultForm.niche}
                            onChange={(e) => setTempDefaultForm({ ...tempDefaultForm, niche: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Intended Result</label>
                          <textarea
                            value={tempDefaultForm.intendedResult}
                            onChange={(e) => setTempDefaultForm({ ...tempDefaultForm, intendedResult: e.target.value })}
                            rows={3}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Target Audience</label>
                          <textarea
                            value={tempDefaultForm.targetAudience}
                            onChange={(e) => setTempDefaultForm({ ...tempDefaultForm, targetAudience: e.target.value })}
                            rows={2}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Geographical Locations</label>
                          <input
                            type="text"
                            value={tempDefaultForm.geoLocations}
                            onChange={(e) => setTempDefaultForm({ ...tempDefaultForm, geoLocations: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Keywords (comma-separated)</label>
                          <input
                            type="text"
                            value={tempDefaultForm.keywords.join(", ")}
                            onChange={(e) =>
                              setTempDefaultForm({
                                ...tempDefaultForm,
                                keywords: e.target.value.split(",").map((k) => k.trim()),
                              })
                            }
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Additional Instructions</label>
                          <textarea
                            value={tempDefaultForm.additionalInstructions}
                            onChange={(e) =>
                              setTempDefaultForm({ ...tempDefaultForm, additionalInstructions: e.target.value })
                            }
                            rows={3}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Competitors (comma-separated, optional)
                          </label>
                          <input
                            type="text"
                            value={tempDefaultForm.competitors.join(", ")}
                            onChange={(e) =>
                              setTempDefaultForm({
                                ...tempDefaultForm,
                                competitors: e.target.value.split(",").map((c) => c.trim()).filter(c => c.length > 0),
                              })
                            }
                            placeholder="Leave empty if unknown - can be filled manually later"
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This field will not be auto-generated. Fill it manually if you know the competitors.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="includeKeyPoints"
                            checked={tempDefaultForm.includeKeyPoints}
                            onChange={(e) =>
                              setTempDefaultForm({ ...tempDefaultForm, includeKeyPoints: e.target.checked })
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeKeyPoints" className="text-sm font-medium text-gray-700">
                            Include Key Points
                          </label>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Content Preference</label>
                          <select
                            value={tempDefaultForm.contentPreference}
                            onChange={(e) =>
                              setTempDefaultForm({
                                ...tempDefaultForm,
                                contentPreference: e.target.value as "create" | "enhance",
                              })
                            }
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="create">Create New Content</option>
                            <option value="enhance">Enhance Existing Content</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Business Name</div>
                          <div className="mt-1 text-sm text-gray-900">
                            {selectedClient.defaultFormValues.businessName}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Niche</div>
                          <div className="mt-1 text-sm text-gray-900">{selectedClient.defaultFormValues.niche}</div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Intended Result
                          </div>
                          <div className="mt-1 text-sm text-gray-900">
                            {selectedClient.defaultFormValues.intendedResult}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Target Audience
                          </div>
                          <div className="mt-1 text-sm text-gray-900">
                            {selectedClient.defaultFormValues.targetAudience}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Geographical Locations
                          </div>
                          <div className="mt-1 text-sm text-gray-900">
                            {selectedClient.defaultFormValues.geoLocations}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Keywords</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {selectedClient.defaultFormValues.keywords.map((keyword, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Additional Instructions
                          </div>
                          <div className="mt-1 text-sm text-gray-900">
                            {selectedClient.defaultFormValues.additionalInstructions}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Competitors</div>
                          <div className="mt-1 text-sm text-gray-900">
                            {selectedClient.defaultFormValues.competitors.join(", ")}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Include Key Points
                          </div>
                          <div className="mt-1 text-sm text-gray-900">
                            {selectedClient.defaultFormValues.includeKeyPoints ? "Yes" : "No"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Content Preference
                          </div>
                          <div className="mt-1 text-sm text-gray-900 capitalize">
                            {selectedClient.defaultFormValues.contentPreference}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 sticky bottom-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowClientBio(false)
                    setEditingBio(false)
                    setEditingDefaults(false)
                    setClientBioTab("bio")
                  }}
                >
                  Close
                </Button>
                {clientBioTab === "bio" && editingBio && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleSaveClientData}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </Button>
                )}
                {clientBioTab === "bio" && !editingBio && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setEditingBio(true)}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit Bio
                  </Button>
                )}
              </div>
          </div>
        </div>
      )}

      {showPromptModal && (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={() => setShowPromptModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Edit Prompt</h3>
                    <p className="text-sm text-gray-500">Step: {currentStepForPrompt}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex max-h-[calc(85vh-180px)]">
                {/* Left: Variables Sidebar */}
                <div className="w-80 border-r border-gray-200 overflow-y-auto bg-gray-50 p-4">
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">Available Variables</h4>
                    <p className="text-xs text-gray-500">Click to copy • Variables auto-populate when running</p>
                  </div>
                  {getAvailableVariables(currentStepForPrompt).length === 0 ? (
                    <div className="text-sm text-gray-500 italic p-3 bg-white border border-gray-200 rounded">
                      No variables available yet. Complete previous steps to unlock variables.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getAvailableVariables(currentStepForPrompt).map((variable) => (
                        <div
                          key={variable.tag}
                          className="p-3 bg-white border border-gray-200 hover:border-blue-300 rounded transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <code className="text-xs font-mono text-blue-600 font-semibold break-all">
                              {variable.tag}
                            </code>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setViewingVariable({
                                    tag: variable.tag,
                                    content: getVariableFullContent(variable.tag)
                                  })
                                }}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                title="View full content"
                              >
                                <Eye className="h-3 w-3 text-gray-400 hover:text-blue-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigator.clipboard.writeText(variable.tag)
                                }}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                title="Copy variable tag"
                              >
                                <Copy className="h-3 w-3 text-gray-400 hover:text-blue-600" />
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">{variable.description}</div>
                          <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded border border-gray-100 line-clamp-2">
                            {variable.preview}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Prompt Editor */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <Textarea
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm min-h-[500px] resize-none w-full"
                    placeholder="Edit the prompt here... Use variables from the sidebar by clicking to copy them."
                  />
                  <div className="mt-3 text-xs text-gray-500">
                    💡 <strong>Tip:</strong> Variables are automatically replaced with actual values when the step runs.
                    You can manually reference data or use the variable tags for clarity.
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between gap-2 sticky bottom-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(currentPrompt)
                  }}
                  className="bg-transparent"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy Prompt
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowPromptModal(false)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Run the step with the edited prompt
                      setShowPromptModal(false);
                      runStepWrapper(currentStepForPrompt);
                    }}
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Run with Edited Prompt
                  </Button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Variable Viewer Modal */}
      {viewingVariable && (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
            onClick={() => setViewingVariable(null)}
          >
            <div
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Variable Content</h3>
                    <code className="text-sm text-blue-600 font-mono">{viewingVariable.tag}</code>
                  </div>
                </div>
                <button
                  onClick={() => setViewingVariable(null)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap break-words">
                  {viewingVariable.content || '(Empty)'}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between gap-2 sticky bottom-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingVariable.content)
                  }}
                  className="bg-transparent"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy Content
                </Button>
                <Button variant="outline" size="sm" onClick={() => setViewingVariable(null)}>
                  Close
                </Button>
              </div>
          </div>
        </div>
      )}
    </div>
  )
}
