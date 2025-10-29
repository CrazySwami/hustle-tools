/**
 * Unified Diff Parser and Applier
 *
 * Parses unified diff patches and applies them to original code.
 * Handles standard unified diff format with @@ markers.
 */

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

/**
 * Parse unified diff format
 *
 * Example input:
 * ```
 * @@ -10,7 +10,7 @@
 *    padding: 20px;
 *    margin: 0 auto;
 *  }
 * -.button {
 * -  background: red;
 * +.button {
 * +  background: blue;
 *  }
 * ```
 */
export function parseUnifiedDiff(diffText: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const lines = diffText.split('\n');

  let currentHunk: DiffHunk | null = null;

  for (const line of lines) {
    // Match hunk header: @@ -10,7 +10,7 @@
    const hunkMatch = line.match(/^@@\s+-(\d+),(\d+)\s+\+(\d+),(\d+)\s+@@/);

    if (hunkMatch) {
      // Save previous hunk if exists
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      // Start new hunk
      currentHunk = {
        oldStart: parseInt(hunkMatch[1]),
        oldLines: parseInt(hunkMatch[2]),
        newStart: parseInt(hunkMatch[3]),
        newLines: parseInt(hunkMatch[4]),
        lines: []
      };
    } else if (currentHunk) {
      // Add line to current hunk
      currentHunk.lines.push(line);
    }
  }

  // Save last hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Apply unified diff to original code
 *
 * @param original - Original code
 * @param diffText - Unified diff patch
 * @returns Modified code
 */
export function applyUnifiedDiff(original: string, diffText: string): string {
  // If diff doesn't contain @@ markers, assume it's full file replacement
  if (!diffText.includes('@@')) {
    console.log('📄 No diff markers found - treating as full file replacement');
    return diffText.trim();
  }

  const hunks = parseUnifiedDiff(diffText);

  if (hunks.length === 0) {
    console.warn('⚠️ No hunks found in diff, returning original');
    return original;
  }

  const originalLines = original.split('\n');
  const result: string[] = [];

  let currentOriginalLine = 0;

  for (const hunk of hunks) {
    // Copy lines before this hunk
    while (currentOriginalLine < hunk.oldStart - 1) {
      result.push(originalLines[currentOriginalLine]);
      currentOriginalLine++;
    }

    // Apply hunk changes
    let hunkLineIndex = 0;

    for (const line of hunk.lines) {
      if (line.startsWith('-')) {
        // Deletion - skip original line
        currentOriginalLine++;
      } else if (line.startsWith('+')) {
        // Addition - add new line
        result.push(line.substring(1));
      } else {
        // Context line - copy from original
        result.push(originalLines[currentOriginalLine]);
        currentOriginalLine++;
      }
    }
  }

  // Copy remaining lines after last hunk
  while (currentOriginalLine < originalLines.length) {
    result.push(originalLines[currentOriginalLine]);
    currentOriginalLine++;
  }

  return result.join('\n');
}

/**
 * Detect if text is a unified diff or full file
 */
export function isDiffFormat(text: string): boolean {
  return text.includes('@@') && /^@@\s+-\d+,\d+\s+\+\d+,\d+\s+@@/m.test(text);
}

/**
 * Calculate diff statistics
 */
export function getDiffStats(diffText: string): { additions: number; deletions: number; changes: number } {
  const lines = diffText.split('\n');
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  return {
    additions,
    deletions,
    changes: additions + deletions
  };
}
