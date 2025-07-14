import { rgb } from 'pdf-lib';
import { convertWebToPdfCoordinates, validateCoordinates } from '../coordinateConverter';
import { calculateOptimalDimensions, validateFinalCoordinates } from './aspectRatioCalculator';
import { RenderContext } from './types';

/**
 * Renders signature or initial fields with proper aspect ratio and scaling
 */
export const renderSignatureField = async (context: RenderContext): Promise<void> => {
  const { field, signedField, signer, pageWidth, pageHeight, pdfDoc, helveticaBoldFont } = context;
  
  console.log(`Processing ${field.type} field on page ${field.page}:`, { 
    fieldId: field.id,
    fieldCoords: { x: field.x, y: field.y, width: field.width, height: field.height },
    signedField: signedField ? {
      id: signedField.id,
      hasCoordinates: !!signedField.signature_coordinates,
      coordinates: signedField.signature_coordinates
    } : null,
    pageSize: { width: pageWidth, height: pageHeight }
  });

  const signatureData = signedField?.value || signer?.signature_data;
  
  if (!signatureData) {
    console.log(`Field ${field.id} - No signature data found, using text fallback`);
    renderTextFallback(context);
    return;
  }

  try {
    console.log(`Embedding signature image for field ${field.id}`);
    const signatureImage = await pdfDoc.embedPng(signatureData);
    
    let coords = getFieldCoordinates(field, signedField, pageWidth, pageHeight);
    
    // Normalize signature field size to standard dimensions (126.28x40.6 - 7x larger)
    const standardWidth = 126.28;
    const standardHeight = 40.6;
    
    // Use the field's position but standardized dimensions
    coords = {
      x: coords.x,
      y: coords.y,
      width: standardWidth,
      height: standardHeight
    };
    
    // Apply optimal sizing with standard dimensions
    const signatureDims = signatureImage.size();
    const finalCoords = calculateOptimalDimensions(coords, signatureDims);
    
    // Validate final coordinates
    if (!validateFinalCoordinates(finalCoords, pageWidth, pageHeight)) {
      console.warn(`Field ${field.id} - Final coordinates exceed page bounds, falling back to original coords`);
      coords = convertWebToPdfCoordinates(field, pageWidth, pageHeight);
    } else {
      coords = finalCoords;
    }
    
    console.log(`Field ${field.id} - Final drawing coordinates:`, coords);
    
    context.page.drawImage(signatureImage, {
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
    });
    
  } catch (error) {
    console.error(`Field ${field.id} - Error embedding signature image:`, error);
    renderTextFallback(context);
  }
};

/**
 * Gets the appropriate coordinates for the field
 */
const getFieldCoordinates = (
  field: any,
  signedField: any,
  pageWidth: number,
  pageHeight: number
) => {
  // Use exact coordinates if available from the signing process
  if (signedField?.signature_coordinates) {
    try {
      const exactCoords = JSON.parse(signedField.signature_coordinates);
      console.log(`Field ${field.id} - Using exact signature coordinates:`, exactCoords);
      
      const coords = {
        x: (exactCoords.x / 100) * pageWidth,
        y: pageHeight - (exactCoords.y / 100) * pageHeight - (exactCoords.height / 100) * pageHeight,
        width: (exactCoords.width / 100) * pageWidth,
        height: (exactCoords.height / 100) * pageHeight
      };
      
      console.log(`Field ${field.id} - Converted coordinates:`, coords);
      
      if (validateCoordinates(coords, pageWidth, pageHeight)) {
        return coords;
      } else {
        console.warn(`Field ${field.id} - Invalid exact coordinates, falling back to field bounds`);
      }
    } catch (e) {
      console.warn(`Field ${field.id} - Failed to parse signature coordinates, using field bounds:`, e);
    }
  }
  
  // Fall back to field bounds
  console.log(`Field ${field.id} - No exact coordinates, using field bounds`);
  return convertWebToPdfCoordinates(field, pageWidth, pageHeight);
};

/**
 * Fallback text rendering for signatures
 */
const renderTextFallback = (context: RenderContext) => {
  const { page, field, signer, pageWidth, pageHeight, helveticaBoldFont } = context;
  const coords = convertWebToPdfCoordinates(field, pageWidth, pageHeight);
  const text = signer?.name || 'Signed';
  const fontSize = Math.min(coords.height * 0.4, 12);
  const textWidth = helveticaBoldFont.widthOfTextAtSize(text, fontSize);
  const textX = coords.x + (coords.width - textWidth) / 2;
  
  page.drawText(text, {
    x: textX,
    y: coords.y + coords.height / 2 - fontSize / 2,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0.8),
  });
};