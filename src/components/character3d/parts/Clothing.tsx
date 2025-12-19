import React from 'react';
import { BodyConfig } from '../types';

interface ClothingProps {
  body: BodyConfig;
  accessoryColor: string;
  clothingType?: string;
}

/**
 * Renders clothing overlays on the character body.
 * Supports: dress, jacket, hoodie, vest, apron, labcoat
 */
export function Clothing({ body, accessoryColor, clothingType }: ClothingProps) {
  if (!clothingType || clothingType === 'none') return null;

  return (
    <>
      {/* Dress */}
      {clothingType === 'dress' && (
        <>
          {/* Dress top */}
          <mesh position={[0, body.torso.y, 0.01]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.82, body.clothing.height, body.clothing.depth * 0.9]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.7} />
          </mesh>
          {/* Dress skirt - flared */}
          <mesh position={[0, body.torsoBottom - 0.1, 0]} castShadow>
            <boxGeometry args={[body.torso.width, 0.4, body.torso.depth * 1.1]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.7} />
          </mesh>
          {/* Dress waist ribbon */}
          <mesh position={[0, body.torsoBottom + 0.1, body.frontZOuter]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.85, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
        </>
      )}

      {/* Jacket */}
      {clothingType === 'jacket' && (
        <>
          {/* Jacket body */}
          <mesh position={[0, body.torso.y, 0.01]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.85, body.clothing.height, body.clothing.depth * 0.92]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.7} />
          </mesh>
          {/* Jacket lapel left */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.15, body.frontZOuter - 0.01]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.15, 0.3, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.7} />
          </mesh>
          {/* Jacket lapel right */}
          <mesh position={[body.torso.width * 0.24, body.torso.y + 0.15, body.frontZOuter - 0.01]} rotation={[0, 0, -0.2]} castShadow>
            <boxGeometry args={[0.15, 0.3, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.7} />
          </mesh>
          {/* Shirt visible underneath */}
          <mesh position={[0, body.torso.y + 0.1, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.12, 0.35, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Jacket buttons */}
          <mesh position={[0, body.torso.y - 0.05, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          <mesh position={[0, body.torso.y - 0.17, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Hoodie */}
      {clothingType === 'hoodie' && (
        <>
          {/* Hoodie body */}
          <mesh position={[0, body.torso.y, 0.01]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.85, body.clothing.height, body.clothing.depth * 0.92]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Hoodie pocket */}
          <mesh position={[0, body.torso.y - 0.2, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[body.torso.width * 0.53, 0.18, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Pocket line */}
          <mesh position={[0, body.torso.y - 0.11, body.frontZOuter]} castShadow>
            <boxGeometry args={[body.torso.width * 0.47, 0.02, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          {/* Hood (behind head) */}
          <mesh position={[0, body.torsoTop + 0.1, body.torsoBack + 0.05]} castShadow>
            <boxGeometry args={[body.torso.width * 0.73, 0.35, 0.2]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Drawstrings */}
          <mesh position={[-0.1, body.torso.y + 0.2, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[0.03, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          <mesh position={[0.1, body.torso.y + 0.2, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[0.03, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Vest */}
      {clothingType === 'vest' && (
        <>
          {/* Vest body (open front) */}
          <mesh position={[-body.torso.width * 0.27, body.torso.y, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.2, body.torso.height * 0.93, 0.04]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.7} />
          </mesh>
          <mesh position={[body.torso.width * 0.27, body.torso.y, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.2, body.torso.height * 0.93, 0.04]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.7} />
          </mesh>
          {/* Vest back */}
          <mesh position={[0, body.torso.y, body.backZ]} castShadow>
            <boxGeometry args={[body.torso.width * 0.77, body.torso.height * 0.93, 0.04]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.7} />
          </mesh>
          {/* Shirt underneath */}
          <mesh position={[0, body.torso.y, body.frontZOuter - 0.03]} castShadow>
            <boxGeometry args={[0.18, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Vest buttons */}
          <mesh position={[-0.12, body.torso.y + 0.1, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[-0.12, body.torso.y - 0.03, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
          </mesh>
        </>
      )}

      {/* Apron */}
      {clothingType === 'apron' && (
        <>
          {/* Apron bib */}
          <mesh position={[0, body.torso.y + 0.1, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 0.6, 0.45, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Apron skirt */}
          <mesh position={[0, body.torsoBottom - 0.2, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 0.73, 0.5, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Apron pocket */}
          <mesh position={[0, body.torsoBottom, body.frontZOuter]} castShadow>
            <boxGeometry args={[body.torso.width * 0.4, 0.15, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Neck strap */}
          <mesh position={[0, body.torsoTop, 0.02]} castShadow>
            <boxGeometry args={[0.06, 0.08, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          {/* Waist ties */}
          <mesh position={[-body.torso.width * 0.47, body.torsoBottom + 0.22, -0.05]} castShadow>
            <boxGeometry args={[0.15, 0.06, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
          <mesh position={[body.torso.width * 0.47, body.torsoBottom + 0.22, -0.05]} castShadow>
            <boxGeometry args={[0.15, 0.06, 0.02]} />
            <meshStandardMaterial color={accessoryColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* Lab Coat */}
      {clothingType === 'labcoat' && (
        <>
          {/* Lab coat body - long */}
          <mesh position={[0, body.torso.y - 0.15, 0.01]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.9, body.torso.height * 1.4, body.clothing.depth * 0.95]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Coat collar left */}
          <mesh position={[-body.torso.width * 0.27, body.neckY - 0.03, body.frontZOuter - 0.01]} rotation={[0, 0, 0.15]} castShadow>
            <boxGeometry args={[0.18, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Coat collar right */}
          <mesh position={[body.torso.width * 0.27, body.neckY - 0.03, body.frontZOuter - 0.01]} rotation={[0, 0, -0.15]} castShadow>
            <boxGeometry args={[0.18, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Coat pockets */}
          <mesh position={[-body.torso.width * 0.27, body.torsoBottom, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.2, 0.25, 0.02]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
          </mesh>
          <mesh position={[body.torso.width * 0.27, body.torsoBottom, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.2, 0.25, 0.02]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
          </mesh>
          {/* Breast pocket */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.1, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.12, 0.1, 0.02]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
          </mesh>
          {/* Pen in pocket */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.13, body.frontZOuter + 0.02]} castShadow>
            <boxGeometry args={[0.02, 0.08, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          {/* Buttons */}
          <mesh position={[0, body.torso.y + 0.05, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
          </mesh>
          <mesh position={[0, body.torso.y - 0.1, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
          </mesh>
          <mesh position={[0, body.torso.y - 0.25, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
          </mesh>
        </>
      )}
    </>
  );
}
