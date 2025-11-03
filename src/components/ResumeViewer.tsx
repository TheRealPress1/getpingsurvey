import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/OptimizedImage';

interface ResumeViewerProps {
  url: string;
  fileName?: string;
  height?: number;
  className?: string;
}

export const ResumeViewer: React.FC<ResumeViewerProps> = ({ 
  url, 
  fileName = 'resume', 
  height = 600, 
  className 
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Determine file type from URL or filename
  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isDocx = url.match(/\.docx$/i) || fileName.match(/\.docx$/i);

  return (
    <div className={cn('w-full border border-primary/20 rounded-xl overflow-hidden bg-background/30 backdrop-blur-sm', className)}>
      {/* Header with Controls */}
      <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between flex-wrap gap-3">
        <p className="font-semibold iridescent-text">Resume Preview</p>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleOpenNewTab} variant="outline" size="sm">
            <ExternalLink className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Open</span>
          </Button>
          <Button onClick={handleDownload} size="sm">
            <Download className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* Content Viewer */}
      <div 
        className="relative w-full bg-muted/30 flex items-center justify-center p-6"
        style={{ height }}
      >
        {isImage ? (
          // Display image directly
          <div className="w-full h-full flex items-center justify-center">
            <OptimizedImage
              src={url}
              alt={fileName}
              className="max-w-full max-h-full object-contain shadow-lg rounded"
            />
          </div>
        ) : isDocx ? (
          // Display DOCX as downloadable document
          <div className="flex flex-col items-center justify-center text-center max-w-md">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{fileName}</h3>
            <p className="text-muted-foreground mb-6">
              Word document preview is not available in browser. Download to view the full resume.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleDownload} size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </Button>
            </div>
          </div>
        ) : (
          // Fallback for other file types
          <div className="flex flex-col items-center justify-center text-center max-w-md">
            <FileText className="w-16 h-16 text-primary mb-4" />
            <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
            <div className="flex gap-2">
              <Button onClick={handleOpenNewTab} variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
