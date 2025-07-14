import { useCallback } from 'react';

interface FieldCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useSignatureCapture = () => {
  const captureFieldCoordinates = useCallback((fieldElement: HTMLElement, containerElement: HTMLElement): FieldCoordinates => {
    const fieldRect = fieldElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    
    // Calculate percentage-based coordinates relative to the container
    const x = ((fieldRect.left - containerRect.left) / containerRect.width) * 100;
    const y = ((fieldRect.top - containerRect.top) / containerRect.height) * 100;
    const width = (fieldRect.width / containerRect.width) * 100;
    const height = (fieldRect.height / containerRect.height) * 100;
    
    return { x, y, width, height };
  }, []);

  return { captureFieldCoordinates };
};