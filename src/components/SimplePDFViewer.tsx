import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimplePDFViewerProps {
  url: string;
  fileName?: string;
  height?: number;
  className?: string;
}

export const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({ 
  url, 
  fileName = 'document.pdf', 
  height = 600, 
  className 
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleOpenNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(false);
  };

  return (
    <div className={cn('w-full border border-primary/20 rounded-xl overflow-hidden bg-background/30 backdrop-blur-sm', className)}>
      {/* Header with Controls */}
      <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between flex-wrap gap-3">
        <p className="font-semibold iridescent-text">Resume Preview</p>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Action Buttons */}
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

      {/* PDF Viewer */}
      <div 
        className="relative w-full bg-muted/30"
        style={{ height }}
      >
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground text-sm">Loading PDF...</p>
          </div>
        )}

        {iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Unable to display PDF in browser</p>
            <p className="text-sm text-muted-foreground mb-4">Try downloading or opening in a new tab instead.</p>
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

        <iframe
          src={`${url}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
          className={cn(
            "w-full h-full border-0",
            !iframeLoaded && "opacity-0"
          )}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="PDF Preview"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
};