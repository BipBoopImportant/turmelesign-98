/**
 * Converts signature coordinates from web interface percentages to PDF absolute coordinates
 * Handles the coordinate system differences between web (top-left origin) and PDF (bottom-left origin)
 */
export const convertWebToPdfCoordinates = (
  webCoords: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number
) => {
  console.log('Converting coordinates:', { webCoords, pageWidth, pageHeight });
  
  // Convert percentage-based coordinates to absolute PDF coordinates
  const absoluteX = (webCoords.x / 100) * pageWidth;
  const absoluteWidth = (webCoords.width / 100) * pageWidth;
  const absoluteHeight = (webCoords.height / 100) * pageHeight;
  
  // Convert from web coordinate system (top-left origin) to PDF coordinate system (bottom-left origin)
  const absoluteY = pageHeight - ((webCoords.y / 100) * pageHeight) - absoluteHeight;
  
  const result = {
    x: absoluteX,
    y: absoluteY,
    width: absoluteWidth,
    height: absoluteHeight
  };
  
  console.log('Converted coordinates:', result);
  return result;
};

/**
 * Validates that coordinates are within reasonable bounds
 */
export const validateCoordinates = (
  coords: { x: number; y: number; width: number; height: number },
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