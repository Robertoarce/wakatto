/**
 * Helper functions for speech bubble text rendering
 */

/**
 * Wrap text into lines with specified max width
 * Handles both word wrapping and explicit newlines
 */
export function wrapText(str: string, maxWidth: number = 45): string[] {
  const lines: string[] = [];
  // First split by actual newlines
  const paragraphs = str.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

/**
 * Pre-calculate line structure from full text, then reveal characters progressively.
 * This ensures words don't jump between lines as they're being typed.
 *
 * @param fullText - The complete text that will eventually be shown
 * @param revealedLength - How many characters have been revealed so far
 * @param maxWidth - Maximum characters per line
 * @returns Array of lines with only revealed characters shown
 */
export function wrapTextWithReveal(
  fullText: string,
  revealedLength: number,
  maxWidth: number = 45
): string[] {
  if (!fullText || revealedLength <= 0) return [];

  // First, wrap the FULL text to get the final line structure
  const fullLines = wrapText(fullText, maxWidth);

  // Now, reveal characters within this pre-calculated structure
  const revealedLines: string[] = [];
  let charsRemaining = revealedLength;

  for (const line of fullLines) {
    if (charsRemaining <= 0) break;

    if (charsRemaining >= line.length) {
      // Full line revealed
      revealedLines.push(line);
      charsRemaining -= line.length + 1; // +1 for space/newline between lines
    } else {
      // Partial line - reveal up to charsRemaining
      revealedLines.push(line.substring(0, charsRemaining));
      break;
    }
  }

  return revealedLines;
}

/**
 * Get the total character count including spaces between lines
 * Used to sync revealed length with line structure
 */
export function getFullTextLengthWithSpaces(lines: string[]): number {
  if (lines.length === 0) return 0;
  // Sum of all line lengths + spaces between lines
  return lines.reduce((sum, line, i) => sum + line.length + (i < lines.length - 1 ? 1 : 0), 0);
}

/**
 * Calculate opacity for a line based on its position
 * Older lines (at top) fade out, newer lines (at bottom) stay visible
 * @param lineIndex - Index of the line (0 = top/oldest)
 * @param totalVisible - Total number of visible lines
 * @returns Opacity value between 0.15 and 1.0
 */
export function getLineOpacity(lineIndex: number, totalVisible: number): number {
  if (totalVisible <= 1) return 1;

  // lineIndex 0 = top (oldest), totalVisible-1 = bottom (newest)
  // Top line gets lowest opacity, bottom gets full
  const normalizedPosition = lineIndex / (totalVisible - 1); // 0 to 1
  // Opacity ranges from 0.15 (top) to 1.0 (bottom)
  return 0.15 + (normalizedPosition * 0.85);
}
