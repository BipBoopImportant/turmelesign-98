import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

import { PDFControls } from './PDFControls';
import { SignatureFieldComponent } from './SignatureField';
import { TextEditModal } from './TextEditModal';
import { DrawingCanvas } from './DrawingCanvas';

// Set up PDF.js worker with .mjs extension
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  signerEmail: string;
  required: boolean;
  value?: string;
}

interface Signer {
  id: string;
  name: string;
  email: string;
  color: string;
}

interface PDFViewerProps {
  fileUrl: string;
  fields: SignatureField[];
  signers: Signer[];
  selectedTool: 'signature' | 'initial' | 'date' | 'text' | null;
  selectedSigner: string;
  onFieldAdd: (field: Omit<SignatureField, 'id'>) => void;
  onFieldRemove: (fieldId: string) => void;
  onFieldUpdate?: (fieldId: string, updates: Partial<SignatureField>) => void;
  onFieldClick?: (field: SignatureField) => void;
  editable?: boolean;
  mode?: 'edit' | 'sign';
  enableDragDrop?: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fields,
  signers,
  selectedTool,
  selectedSigner,
  onFieldAdd,
  onFieldRemove,
  onFieldUpdate,
  onFieldClick,
  editable = true,
  mode = 'edit',
  enableDragDrop = false
}) => {
  const { t } = useLanguage();
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [resizingField, setResizingField] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageInput, setPageInput] = useState('1');
  
  // Real-time field updates and interaction state
  const [liveFieldUpdates, setLiveFieldUpdates] = useState<Record<string, Partial<SignatureField>>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [drawingFieldId, setDrawingFieldId] = useState<string | null>(null);
  
  const pageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // PDF loading callbacks
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    console.log(`PDF loaded with ${numPages} pages`);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPdfDimensions({ width, height });
    console.log(`Page loaded with dimensions: ${width}x${height}`);
  }, []);

  // Field creation and interaction
  const handlePageClick = useCallback((e: React.MouseEvent) => {
    if (!editable || !selectedTool || !selectedSigner || !pageRef.current || mode !== 'edit') return;

    const rect = pageRef.current.getBoundingClientRect();
    const signer = signers.find(s => s.id === selectedSigner);
    if (!signer) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (x < 0 || x > 95 || y < 0 || y > 95) return;

    const fieldDimensions = {
      signature: { width: 25, height: 8 },
      initial: { width: 12, height: 8 },
      date: { width: 18, height: 5 },
      text: { width: 20, height: 5 }
    };

    const newField: Omit<SignatureField, 'id'> = {
      type: selectedTool,
      x: Math.max(0, Math.min(x, 100 - fieldDimensions[selectedTool].width)),
      y: Math.max(0, Math.min(y, 100 - fieldDimensions[selectedTool].height)),
      width: fieldDimensions[selectedTool].width,
      height: fieldDimensions[selectedTool].height,
      page: currentPage,
      signerEmail: signer.email,
      required: true
    };

    onFieldAdd(newField);
    console.log('Added new field:', newField);
  }, [editable, selectedTool, selectedSigner, signers, currentPage, onFieldAdd, mode]);

  // Drag and drop functionality
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!enableDragDrop || !editable || mode !== 'edit') return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, [enableDragDrop, editable, mode]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!enableDragDrop || !editable || !selectedSigner || !pageRef.current || mode !== 'edit') return;

    e.preventDefault();
    
    const fieldType = e.dataTransfer.getData('fieldType') as 'signature' | 'initial' | 'date' | 'text';
    if (!fieldType) return;

    const rect = pageRef.current.getBoundingClientRect();
    const signer = signers.find(s => s.id === selectedSigner);
    if (!signer) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const fieldDimensions = {
      signature: { width: 25, height: 8 },
      initial: { width: 12, height: 8 },
      date: { width: 18, height: 5 },
      text: { width: 20, height: 5 }
    };

    const boundedX = Math.max(0, Math.min(x, 100 - fieldDimensions[fieldType].width));
    const boundedY = Math.max(0, Math.min(y, 100 - fieldDimensions[fieldType].height));

    const newField: Omit<SignatureField, 'id'> = {
      type: fieldType,
      x: boundedX,
      y: boundedY,
      width: fieldDimensions[fieldType].width,
      height: fieldDimensions[fieldType].height,
      page: currentPage,
      signerEmail: signer.email,
      required: true
    };

    onFieldAdd(newField);
    console.log('Dropped field:', newField);
  }, [enableDragDrop, editable, selectedSigner, signers, currentPage, onFieldAdd, mode]);

  // Field manipulation (drag/resize)
  const handleFieldMouseDown = useCallback((e: React.MouseEvent, fieldId: string, handle?: string) => {
    if (!editable || mode !== 'edit' || !pageRef.current) return;
    
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    
    if (handle) {
      setResizingField(fieldId);
      setResizeHandle(handle);
      setIsResizing(true);
    } else {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        const rect = pageRef.current.getBoundingClientRect();
        const fieldLeft = (field.x / 100) * rect.width;
        const fieldTop = (field.y / 100) * rect.height;
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        setDragOffset({
          x: clickX - fieldLeft,
          y: clickY - fieldTop
        });
      }
      
      setDraggedField(fieldId);
      setIsDragging(true);
    }
    
    document.body.style.cursor = handle ? 
      (handle.includes('n') && handle.includes('w') ? 'nw-resize' :
       handle.includes('n') && handle.includes('e') ? 'ne-resize' :
       handle.includes('s') && handle.includes('w') ? 'sw-resize' :
       handle.includes('s') && handle.includes('e') ? 'se-resize' : 'default') : 'grabbing';
    
    document.body.style.userSelect = 'none';
  }, [editable, mode, fields]);

  const updateFieldPosition = useCallback((e: MouseEvent) => {
    if (!pageRef.current || !onFieldUpdate) return;

    const rect = pageRef.current.getBoundingClientRect();

    if (draggedField) {
      const field = fields.find(f => f.id === draggedField);
      if (!field) return;

      const newX = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const newY = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

      const boundedX = Math.max(0, Math.min(newX, 100 - field.width));
      const boundedY = Math.max(0, Math.min(newY, 100 - field.height));

      setLiveFieldUpdates(prev => ({
        ...prev,
        [draggedField]: { x: boundedX, y: boundedY }
      }));

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        onFieldUpdate(draggedField, { x: boundedX, y: boundedY });
      });
    }

    if (resizingField && resizeHandle) {
      const field = fields.find(f => f.id === resizingField);
      if (!field) return;

      const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

      let updates: Partial<SignatureField> = {};

      const minDimensions = {
        signature: { width: 3, height: 0.5 },
        initial: { width: 2, height: 0.5 },
        date: { width: 3, height: 0.5 },
        text: { width: 2, height: 0.5 }
      };

      const minWidth = minDimensions[field.type]?.width || 2;
      const minHeight = minDimensions[field.type]?.height || 0.5;

      switch (resizeHandle) {
        case 'se':
          updates.width = Math.max(minWidth, Math.min(mouseX - field.x, 100 - field.x));
          updates.height = Math.max(minHeight, Math.min(mouseY - field.y, 100 - field.y));
          break;
        case 'sw':
          const newWidth = Math.max(minWidth, field.x + field.width - mouseX);
          updates.x = Math.max(0, field.x + field.width - newWidth);
          updates.width = newWidth;
          updates.height = Math.max(minHeight, Math.min(mouseY - field.y, 100 - field.y));
          break;
        case 'ne':
          const newHeight = Math.max(minHeight, field.y + field.height - mouseY);
          updates.y = Math.max(0, field.y + field.height - newHeight);
          updates.height = newHeight;
          updates.width = Math.max(minWidth, Math.min(mouseX - field.x, 100 - field.x));
          break;
        case 'nw':
          const newWidthNW = Math.max(minWidth, field.x + field.width - mouseX);
          const newHeightNW = Math.max(minHeight, field.y + field.height - mouseY);
          updates.x = Math.max(0, field.x + field.width - newWidthNW);
          updates.y = Math.max(0, field.y + field.height - newHeightNW);
          updates.width = newWidthNW;
          updates.height = newHeightNW;
          break;
      }

      setLiveFieldUpdates(prev => ({
        ...prev,
        [resizingField]: updates
      }));

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        onFieldUpdate(resizingField, updates);
      });
    }
  }, [draggedField, resizingField, resizeHandle, fields, onFieldUpdate, dragOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updateFieldPosition(e.nativeEvent);
  }, [updateFieldPosition]);

  const handleMouseUp = useCallback(() => {
    if (draggedField) {
      setDraggedField(null);
      setIsDragging(false);
    }
    if (resizingField) {
      setResizingField(null);
      setResizeHandle(null);
      setIsResizing(false);
    }
    
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setLiveFieldUpdates({});
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [draggedField, resizingField]);

  // Global mouse events for smooth dragging
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateFieldPosition(e);
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, updateFieldPosition, handleMouseUp]);

  // PDF Controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const rotateLeft = () => setRotation(prev => prev - 90);
  const rotateRight = () => setRotation(prev => prev + 90);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, numPages));
    setCurrentPage(targetPage);
    setPageInput(targetPage.toString());
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput);
      if (!isNaN(page)) {
        goToPage(page);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Preview functionality
  const handleFieldPreview = useCallback((fieldId: string, fieldType: 'signature' | 'initial' | 'date' | 'text') => {
    if (mode !== 'edit' || !editable) return;
    
    if (fieldType === 'signature' || fieldType === 'initial') {
      setDrawingFieldId(fieldId);
      setShowDrawingCanvas(true);
    } else if (fieldType === 'date') {
      const currentDate = new Date().toLocaleDateString();
      setPreviewValues(prev => ({ ...prev, [fieldId]: currentDate }));
    } else if (fieldType === 'text') {
      setEditingField(fieldId);
    }
  }, [mode, editable]);

  const handlePreviewValueChange = useCallback((fieldId: string, value: string) => {
    setPreviewValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleTextEditComplete = useCallback(() => {
    setEditingField(null);
  }, []);

  const handleDrawingComplete = useCallback((drawingData: string) => {
    if (drawingFieldId) {
      setPreviewValues(prev => ({ ...prev, [drawingFieldId]: drawingData }));
    }
    setShowDrawingCanvas(false);
    setDrawingFieldId(null);
  }, [drawingFieldId]);

  const currentPageFields = fields.filter(field => field.page === currentPage);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* PDF Controls */}
      <PDFControls
        scale={scale}
        currentPage={currentPage}
        numPages={numPages}
        pageInput={pageInput}
        isFullscreen={isFullscreen}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onRotateLeft={rotateLeft}
        onRotateRight={rotateRight}
        onToggleFullscreen={toggleFullscreen}
        onPageChange={goToPage}
        onPageInputChange={handlePageInputChange}
        onPageInputKeyDown={handlePageInputKeyDown}
      />

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <div 
                className={`relative ${enableDragDrop ? 'transition-all duration-200' : ''}`}
                ref={pageRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center h-96 bg-gray-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">{t('common.loading')}</p>
                      </div>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-96 bg-red-50 text-red-600">
                      <div className="text-center">
                        <p className="font-medium">Failed to load PDF</p>
                        <p className="text-sm">Please check the file and try again</p>
                      </div>
                    </div>
                  }
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    rotate={rotation}
                    onLoadSuccess={onPageLoadSuccess}
                    onClick={handlePageClick}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className={
                      editable && selectedTool && mode === 'edit' 
                        ? 'cursor-crosshair' 
                        : enableDragDrop && editable && mode === 'edit'
                        ? 'cursor-copy'
                        : 'cursor-default'
                    }
                    loading={
                      <div className="flex items-center justify-center h-96 bg-gray-50">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    }
                  />
                </Document>

                {/* Signature Fields Overlay */}
                {currentPageFields.map((field) => {
                  const signer = signers.find(s => s.email === field.signerEmail);
                  const isSelected = selectedFieldId === field.id;
                  const isFieldDragging = draggedField === field.id;
                  const isFieldResizing = resizingField === field.id;
                  
                  return (
                    <SignatureFieldComponent
                      key={field.id}
                      field={field}
                      signer={signer}
                      isSelected={isSelected}
                      isFieldDragging={isFieldDragging}
                      isFieldResizing={isFieldResizing}
                      previewValue={previewValues[field.id]}
                      rotation={rotation}
                      editable={editable}
                      mode={mode}
                      liveUpdates={liveFieldUpdates[field.id]}
                      onMouseDown={handleFieldMouseDown}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mode === 'edit') {
                          setSelectedFieldId(field.id);
                        } else if (mode === 'sign' && onFieldClick) {
                          onFieldClick(field);
                        }
                      }}
                      onRemove={(fieldId) => {
                        onFieldRemove(fieldId);
                        setSelectedFieldId(null);
                      }}
                      onPreview={handleFieldPreview}
                      onClearPreview={(fieldId) => {
                        setPreviewValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[fieldId];
                          return newValues;
                        });
                      }}
                    />
                  );
                })}

                {/* Enhanced helper text for drag & drop */}
                {enableDragDrop && editable && mode === 'edit' && currentPageFields.length === 0 && selectedSigner && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 text-center max-w-md">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-blue-600 font-medium mb-1">{t('pdfViewer.dragDropFieldsHere')}</p>
                      <p className="text-blue-500 text-sm">
                        {t('pdfViewer.dragFieldsFromSidebar')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Page Navigation */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 bg-white border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            {t('pagination.previous')}
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(numPages, 10) }, (_, i) => {
              const pageNum = i + 1;
              
              const showPage = pageNum <= 3 || 
                              pageNum > numPages - 3 || 
                              Math.abs(pageNum - currentPage) <= 1;
              
              if (!showPage) {
                if (pageNum === 4 && currentPage > 6) {
                  return <span key="ellipsis-start" className="px-2 text-gray-400">...</span>;
                }
                if (pageNum === numPages - 3 && currentPage < numPages - 5) {
                  return <span key="ellipsis-end" className="px-2 text-gray-400">...</span>;
                }
                return null;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
          >
            {t('pagination.next')}
          </Button>
        </div>
      )}

      {/* Text Input Modal for Preview */}
      <TextEditModal
        isOpen={!!editingField}
        fieldId={editingField || ''}
        value={previewValues[editingField || ''] || ''}
        onValueChange={handlePreviewValueChange}
        onComplete={handleTextEditComplete}
      />

      {/* Simple Drawing Canvas for Signature/Initial Preview */}
      {showDrawingCanvas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('drawingCanvas.drawYourSignature')}</h3>
            <DrawingCanvas onComplete={handleDrawingComplete} />
          </div>
        </div>
      )}
    </div>
  );
};