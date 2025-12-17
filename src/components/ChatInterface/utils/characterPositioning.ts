/**
 * Character positioning utilities for semi-circle arrangement
 * Characters are arranged like sitting around a table:
 * - Center character is furthest (top/back)
 * - Side characters are closest (bottom/front)
 */

/**
 * Angle ranges per character count for semi-circle arrangement
 */
export const ANGLE_RANGE_BY_COUNT: Record<number, number> = {
  1: 0,    // Centered
  2: 50,   // -25°, +25°
  3: 70,   // -35°, 0°, +35°
  4: 100,  // -50°, -16.7°, +16.7°, +50°
  5: 100,  // -50°, -25°, 0°, +25°, +50°
};

export interface CharacterPosition {
  angle: number;
  angleRad: number;
  horizontalOffset: number;
  distanceFromCenter: number;
  verticalPosition: number;
  scale: number;
  zIndex: number;
  bubblePosition: 'left' | 'right';
  isCenterCharacter: boolean;
}

/**
 * Calculate position for a character in a semi-circle arrangement
 * @param index - Character index in the array
 * @param total - Total number of characters (1-5)
 * @param screenWidth - Current screen width
 * @param characterScaleFactor - Scale factor based on character count
 */
export function calculateCharacterPosition(
  index: number,
  total: number,
  screenWidth: number,
  characterScaleFactor: number = 1
): CharacterPosition {
  // Get angle range for this character count
  const angleRange = ANGLE_RANGE_BY_COUNT[total] ?? 100;
  const startAngle = -angleRange / 2;
  const angleStep = total > 1 ? angleRange / (total - 1) : 0;
  const angle = total === 1 ? 0 : startAngle + (index * angleStep);
  const angleRad = (angle * Math.PI) / 180;

  // Calculate horizontal position (percentage from center)
  // Proportional spread - scales with screen width (30% at 280px, 50% at 768px+)
  const minSpread = 30;
  const maxSpread = 50;
  const spreadFactor = Math.min(
    maxSpread,
    minSpread + ((screenWidth - 280) / (768 - 280)) * (maxSpread - minSpread)
  );
  const horizontalOffset = Math.sin(angleRad) * spreadFactor;

  // Distance from center (0 = center, 1 = edges)
  // Handle single character case where angleRange is 0 to avoid NaN
  const distanceFromCenter = angleRange > 0 ? Math.abs(angle) / (angleRange / 2) : 0;

  // Vertical position: CENTER is higher (further back), EDGES are lower (closer)
  // cos(0) = 1 for center, cos(±70°) ≈ 0.34 for edges
  // Push characters lower when there are more, to leave room for speech bubbles
  const bubbleSpaceOffset = Math.max(0, (total - 1) * 3);
  const verticalPosition = Math.cos(angleRad) * 20 - bubbleSpaceOffset;

  // Scale: CENTER is smaller (further away), EDGES are larger (closer)
  const baseScale = 0.8 + (distanceFromCenter * 0.3); // Center: 0.8, Edges: 1.1
  const scale = baseScale * characterScaleFactor;

  // Z-index: EDGES have higher z-index (in front), CENTER has lower (behind)
  const zIndex = Math.round(distanceFromCenter * 10);

  // Determine speech bubble position based on character position in scene
  // Characters on the left side of center get bubbles on their right, and vice versa
  const bubblePosition: 'left' | 'right' =
    horizontalOffset < 0 ? 'right' : horizontalOffset > 0 ? 'left' : (index % 2 === 0 ? 'right' : 'left');

  // For 5 characters, the center character should have bubble above (like single character)
  const isCenterCharacter = total === 5 && horizontalOffset === 0;

  return {
    angle,
    angleRad,
    horizontalOffset,
    distanceFromCenter,
    verticalPosition,
    scale,
    zIndex,
    bubblePosition,
    isCenterCharacter,
  };
}

/**
 * Calculate character scale factor based on total count
 * More characters = smaller scale
 */
export function getCharacterScaleFactor(total: number): number {
  // Scale down as more characters are added
  switch (total) {
    case 1: return 1.0;
    case 2: return 0.95;
    case 3: return 0.9;
    case 4: return 0.85;
    case 5: return 0.8;
    default: return 0.8;
  }
}

/**
 * Calculate character wrapper style for positioning
 */
export function getCharacterWrapperStyle(
  position: CharacterPosition,
  total: number
) {
  return {
    position: 'absolute' as const,
    left: `${47 + position.horizontalOffset - (100 / total / 2)}%`,
    width: `${Math.max(100 / total, 22)}%`,
    top: `${15 + (20 - position.verticalPosition)}%`,
    transform: [{ scale: position.scale }],
    zIndex: position.zIndex,
  };
}
