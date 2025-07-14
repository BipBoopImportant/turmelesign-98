import { rgb } from 'pdf-lib';
import { convertWebToPdfCoordinates } from '../coordinateConverter';
import { RenderContext } from './types';

/**
 * Renders date fields with proper formatting
 */
export const renderDateField = (context: RenderContext) => {
  const { page, field, signedField, pageWidth, pageHeight, helveticaFont } = context;
  const coords = convertWebToPdfCoordinates(field, pageWidth, pageHeight);
  const dateValue = signedField?.value || new Date().toLocaleDateString();
  const fontSize = Math.min(coords.height * 0.6, 10);
  const textWidth = helveticaFont.widthOfTextAtSize(dateValue, fontSize);
  const textX = coords.x + (coords.width - textWidth) / 2;
  
  page.drawText(dateValue, {
    x: textX,
    y: coords.y + coords.height / 2 - fontSize / 2,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
};

/**
 * Renders text fields with word wrapping and proper formatting
 */
export const renderTextField = (context: RenderContext) => {
  const { page, field, signedField, pageWidth, pageHeight, helveticaFont } = context;
  const coords = convertWebToPdfCoordinates(field, pageWidth, pageHeight);
  const value = signedField?.value || '';
  const fontSize = Math.min(coords.height * 0.6, 10);
  const maxWidth = coords.width * 0.9;
  
  // Handle text wrapping with improved algorithm
  const lines = wrapText(value, fontSize, maxWidth, helveticaFont);
  
  const lineHeight = fontSize * 1.2;
  const totalTextHeight = lines.length * lineHeight;
  const startY = coords.y + (coords.height + totalTextHeight) / 2 - lineHeight;
  
  lines.forEach((line, index) => {
    const textWidth = helveticaFont.widthOfTextAtSize(line, fontSize);
    const textX = coords.x + (coords.width - textWidth) / 2;
    
    page.drawText(line, {
      x: textX,
      y: startY - (index * lineHeight),
      size: fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  });
};

/**
 * Improved text wrapping algorithm
 */
const wrapText = (text: string, fontSize: number, maxWidth: number, font: any): string[] => {
  if (!text.trim()) return [''];
  
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Handle case where single word exceeds max width
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [''];
};