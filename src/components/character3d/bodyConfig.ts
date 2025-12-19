import { useMemo } from 'react';
import { BodyConfig } from './types';

/**
 * Hook that returns the body configuration with all dimensions and derived positions.
 * This centralizes all body measurements so components can reference them consistently.
 */
export function useBodyConfig(): BodyConfig {
  return useMemo(() => {
    // === TORSO ===
    const torso = {
      width: 0.9,
      height: 0.65,
      depth: 0.45,
      y: 0.25,
    };
    // Derived torso positions
    const torsoTop = torso.y + torso.height / 2;
    const torsoBottom = torso.y - torso.height / 2;
    const torsoFront = torso.depth / 2;
    const torsoBack = -torso.depth / 2;

    // === ARMS ===
    const armDiameter = { width: 0.2, depth: 0.25 };
    const upperArm = { ...armDiameter, height: 0.25 };
    const forearm = { ...armDiameter, height: 0.25 };
    const hand = { ...armDiameter, height: 0.1 };
    const armX = torso.width / 2 + armDiameter.width / 2 + 0.025;
    const armY = 0.45;
    const forearmY = -upperArm.height;
    const handY = -(forearm.height / 2 + hand.height / 2);

    // === LEGS ===
    const legDiameter = { width: 0.25, depth: 0.25 };
    const upperLeg = { ...legDiameter, height: 0.22 };
    const lowerLeg = { ...legDiameter, height: 0.22 };
    const foot = { width: 0.25, height: 0.06, depth: 0.35 };
    const legX = 0.15;
    const legY = torsoBottom;
    const lowerLegY = -upperLeg.height;
    const footY = -(lowerLeg.height / 2 + foot.height / 2);
    const footZ = 0.05;

    // === NECK / COLLAR ===
    const neckY = torsoTop - 0.05;
    const collarY = torsoTop;

    // === CLOTHING OVERLAYS (slightly larger than torso) ===
    const clothingOffset = 0.02;
    const clothing = {
      width: torso.width + clothingOffset,
      height: torso.height + clothingOffset,
      depth: torso.depth + clothingOffset,
    };

    // === ACCESSORY Z POSITIONS ===
    const frontZ = torsoFront - 0.02; // On front surface
    const frontZOuter = torsoFront + 0.01; // Just in front of torso
    const backZ = torsoBack + 0.02; // On back surface
    const backZOuter = torsoBack - 0.05; // Behind torso

    return {
      // Torso
      torso, torsoTop, torsoBottom, torsoFront, torsoBack,
      // Arms
      upperArm, forearm, hand, armX, armY, forearmY, handY,
      // Legs
      upperLeg, lowerLeg, foot, legX, legY, lowerLegY, footY, footZ,
      // Neck/collar
      neckY, collarY,
      // Clothing
      clothing,
      // Accessory Z positions
      frontZ, frontZOuter, backZ, backZOuter,
    };
  }, []);
}
