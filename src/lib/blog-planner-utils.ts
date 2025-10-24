/**
 * Blog Planner Utilities
 * Programmatic calculations for blog planning (dates, word counts, etc.)
 */

export interface BlogTopic {
  id: string;
  title: string;
  focusKeyword: string;
  metaDescription: string;
  contentType: 'how-to' | 'listicle' | 'guide' | 'tutorial' | 'comparison';
  publishDate: string;
  weekNumber: number;
  estimatedWordCount: number;
  internalLinkPage: string;
  callToAction: string;
}

export interface BlogPlannerInput {
  month: string;
  postsPerMonth: number;
  niche: string;
  targetAudience: string;
  brandVoice?: string;
  existingTopics?: string[];
}

/**
 * Calculate publish date for a blog post
 * Evenly distributes posts throughout the month
 */
export function calculatePublishDate(month: string, index: number, total: number): string {
  // Parse month (e.g., "January 2025")
  const [monthName, year] = month.split(' ');
  const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
  const yearNum = parseInt(year);

  // Get days in month
  const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();

  // Calculate interval
  const dayInterval = Math.floor(daysInMonth / total);
  const day = Math.max(1, (index * dayInterval) + 1);

  const date = new Date(yearNum, monthIndex, Math.min(day, daysInMonth));

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Calculate week number within the month (1-5)
 */
export function calculateWeekNumber(publishDate: string): number {
  const date = new Date(publishDate);
  const day = date.getDate();
  return Math.ceil(day / 7);
}

/**
 * Calculate estimated word count based on content type
 */
export function calculateWordCount(contentType: BlogTopic['contentType']): number {
  const wordCounts: Record<BlogTopic['contentType'], number> = {
    'how-to': 1500,
    'listicle': 1200,
    'guide': 2500,
    'tutorial': 2000,
    'comparison': 1800,
  };
  return wordCounts[contentType] || 1500;
}

/**
 * Generate a unique ID for a blog topic
 */
export function generateTopicId(): string {
  return `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Enrich AI-generated topics with programmatic data
 */
export function enrichTopics(
  topics: Partial<BlogTopic>[],
  month: string,
  internalLinkPage: string = '/blog',
  callToAction: string = 'Download our free guide'
): BlogTopic[] {
  return topics.map((topic, index) => {
    const publishDate = calculatePublishDate(month, index, topics.length);
    const weekNumber = calculateWeekNumber(publishDate);
    const estimatedWordCount = calculateWordCount(topic.contentType || 'how-to');

    return {
      id: topic.id || generateTopicId(),
      title: topic.title || '',
      focusKeyword: topic.focusKeyword || '',
      metaDescription: topic.metaDescription || '',
      contentType: topic.contentType || 'how-to',
      publishDate,
      weekNumber,
      estimatedWordCount,
      internalLinkPage: topic.internalLinkPage || internalLinkPage,
      callToAction: topic.callToAction || callToAction,
    };
  });
}

/**
 * Export topics as Markdown
 */
export function exportAsMarkdown(topics: BlogTopic[], month: string, niche: string): string {
  const sortedTopics = [...topics].sort((a, b) =>
    new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
  );

  let markdown = `# Blog Content Calendar - ${month}\n`;
  markdown += `**Niche:** ${niche}\n`;
  markdown += `**Total Posts:** ${topics.length}\n\n`;
  markdown += `---\n\n`;

  let currentWeek = 0;

  sortedTopics.forEach((topic) => {
    if (topic.weekNumber !== currentWeek) {
      currentWeek = topic.weekNumber;
      markdown += `## Week ${currentWeek} - ${topic.publishDate}\n\n`;
    }

    markdown += `### ${topic.title}\n\n`;
    markdown += `- **Focus Keyword:** ${topic.focusKeyword}\n`;
    markdown += `- **Meta Description:** ${topic.metaDescription}\n`;
    markdown += `- **Content Type:** ${capitalizeContentType(topic.contentType)}\n`;
    markdown += `- **Estimated Word Count:** ${topic.estimatedWordCount.toLocaleString()} words\n`;
    markdown += `- **Internal Link:** ${topic.internalLinkPage}\n`;
    markdown += `- **Call to Action:** ${topic.callToAction}\n`;
    markdown += `- **Publish Date:** ${topic.publishDate}\n`;
    markdown += `- **Week:** ${topic.weekNumber}\n\n`;
    markdown += `---\n\n`;
  });

  return markdown;
}

/**
 * Export topics as CSV
 */
export function exportAsCSV(topics: BlogTopic[]): string {
  const headers = [
    'Title',
    'Focus Keyword',
    'Meta Description',
    'Content Type',
    'Estimated Word Count',
    'Publish Date',
    'Week Number',
    'Internal Link',
    'Call to Action'
  ];

  let csv = headers.join(',') + '\n';

  const sortedTopics = [...topics].sort((a, b) =>
    new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
  );

  sortedTopics.forEach(topic => {
    const row = [
      escapeCSV(topic.title),
      escapeCSV(topic.focusKeyword),
      escapeCSV(topic.metaDescription),
      escapeCSV(capitalizeContentType(topic.contentType)),
      topic.estimatedWordCount.toString(),
      topic.publishDate,
      topic.weekNumber.toString(),
      escapeCSV(topic.internalLinkPage),
      escapeCSV(topic.callToAction),
    ];
    csv += row.join(',') + '\n';
  });

  return csv;
}

/**
 * Export topics as JSON
 */
export function exportAsJSON(topics: BlogTopic[]): string {
  const sortedTopics = [...topics].sort((a, b) =>
    new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
  );

  return JSON.stringify({ topics: sortedTopics }, null, 2);
}

/**
 * Download content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Detect current section being written
 */
export function detectCurrentSection(markdown: string): string {
  const lines = markdown.split('\n');
  const headings = lines.filter(line => line.startsWith('##'));

  if (headings.length === 0) return 'Introduction';

  const lastHeading = headings[headings.length - 1];
  return lastHeading.replace(/^#+\s*/, '').trim();
}

// Helper functions

function capitalizeContentType(contentType: string): string {
  return contentType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function escapeCSV(text: string): string {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
