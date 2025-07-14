import { AspectRatioResult } from './types';

/**
 * Calculates optimal dimensions while preserving aspect ratio
 */
export const calculateOptimalDimensions = (
  coords: { x: number; y: number; width: number; height: number },
  signatureDims: { width: number; height: number }
): AspectRatioResult => {
  if (signatureDims.width <= 0 || signatureDims.height <= 0) {
    return coords;
  }

  const fieldAspectRatio = coords.width / coords.height;
  const signatureAspectRatio = signatureDims.width / signatureDims.height;
  
  // Store original coords for centering
  const originalCoords = { ...coords };
  let newCoords = { ...coords };

  if (signatureAspectRatio > fieldAspectRatio) {
    // Signature is wider, fit to width
    const newHeight = coords.width / signatureAspectRatio;
    newCoords.height = newHeight;
    newCoords.y = originalCoords.y + (originalCoords.height - newHeight) / 2;
  } else {
    // Signature is taller, fit to height  
    const newWidth = coords.height * signatureAspectRatio;
    newCoords.width = newWidth;
    newCoords.x = originalCoords.x + (originalCoords.width - newWidth) / 2;
  }

  return newCoords;
};

/**
 * Validates that coordinates are within page bounds
 */
export const validateFinalCoordinates = (
  coords: AspectRatioResult,
  pageWidth: number,
  pageHeight: number
): boolean => {
  return (
    coords.x >= 0 &&
    coords.y >= 0 &&
    coords.x + coords.width <= pageWidth &&
    coords.y + coords.height <= pageHeight &&
    coords.width > 0 &&
    coords.height > 0
  );
};