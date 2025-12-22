import React from 'react';
import { BodyConfig } from '../types';

interface HandPropsComponentProps {
  body: BodyConfig;
  hasSword: boolean;
  hasStaff: boolean;
  hasWand: boolean;
  hasShield: boolean;
  hasBook: boolean;
  hasGun: boolean;
  hasPortalGun: boolean;
  hasPipe: boolean;
  hasCigar: boolean;
}

/**
 * Hand props are now rendered inside the arm groups in CharacterDisplay3D.tsx
 * so they move with arm animations.
 *
 * - Right arm: sword, wand, gun, portal_gun
 * - Left arm: staff, shield, book
 * - Head group: pipe, cigar
 *
 * This component is kept for backwards compatibility but renders nothing.
 */
export function HandProps({
  body,
  hasSword,
  hasStaff,
  hasWand,
  hasShield,
  hasBook,
  hasGun,
  hasPortalGun,
  hasPipe,
  hasCigar,
}: HandPropsComponentProps) {
  // All props are now rendered inside their respective body part groups
  // in CharacterDisplay3D.tsx for proper animation attachment
  return null;
}
