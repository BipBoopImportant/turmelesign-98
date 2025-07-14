import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
interface PDFControlsProps {
  scale: number;
  currentPage: number;
  numPages: number;
  pageInput: string;
  isFullscreen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onToggleFullscreen: () => void;
  onPageChange: (page: number) => void;
  onPageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}
export const PDFControls: React.FC<PDFControlsProps> = ({
  scale,
  currentPage,
  numPages,
  pageInput,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  onToggleFullscreen,
  onPageChange,
  onPageInputChange,
  onPageInputKeyDown
}) => {
  return <div className="flex items-center justify-between p-4 border-b shadow-sm bg-card">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onZoomOut} disabled={scale <= 0.5}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Badge variant="outline" className="px-3 py-1 min-w-[60px]">
          {Math.round(scale * 100)}%
        </Badge>
        <Button variant="outline" size="sm" onClick={onZoomIn} disabled={scale >= 3}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRotateLeft}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onRotateRight}>
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1">
          <Input value={pageInput} onChange={onPageInputChange} onKeyDown={onPageInputKeyDown} className="w-12 h-8 text-center text-sm" type="number" min="1" max={numPages} />
          <span className="text-sm text-muted-foreground">of {numPages}</span>
        </div>

        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= numPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
    </div>;
};