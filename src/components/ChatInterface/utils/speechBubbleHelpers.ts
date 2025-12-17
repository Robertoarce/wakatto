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
