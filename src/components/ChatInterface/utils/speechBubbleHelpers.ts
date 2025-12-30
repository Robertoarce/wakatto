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
 * When at a line boundary, shows the empty next line before the word starts typing.
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
  let charsConsumed = 0;

  for (let lineIndex = 0; lineIndex < fullLines.length; lineIndex++) {
    const line = fullLines[lineIndex];
    const lineStart = charsConsumed;
    const lineEnd = charsConsumed + line.length;
    const lineSeparatorEnd = lineEnd + 1; // +1 for space/newline after line

    if (revealedLength <= lineStart) {
      // Haven't reached this line yet
      break;
    }

    if (revealedLength >= lineEnd) {
      // Full line revealed
      revealedLines.push(line);

      // Check if we're at the separator (between lines) - show empty next line
      // This makes the cursor appear on the new line before the word starts
      if (revealedLength > lineEnd && revealedLength <= lineSeparatorEnd && lineIndex + 1 < fullLines.length) {
        revealedLines.push('');
        break;
      }
    } else {
      // Partial line - reveal up to revealedLength
      const charsToShow = revealedLength - lineStart;
      revealedLines.push(line.substring(0, charsToShow));
      break;
    }

    charsConsumed = lineSeparatorEnd;
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
 * @param lineIndex - Index of the line (0 = top/oldest)
 * @param totalVisible - Total number of visible lines
 * @returns Opacity value (always 1.0 - all lines fully visible)
 */
export function getLineOpacity(lineIndex: number, totalVisible: number): number {
  // All lines stay fully visible (no fadeout)
  return 1;
}
