import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, FileText } from 'lucide-react';

interface DocxViewerProps {
  url: string;
  height?: number;
  className?: string;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ url, height = 600, className }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function renderDocx() {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const resp = await fetch(url, { cache: 'no-store', mode: 'cors' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();

        const docxModule: any = await import('docx-preview');
        const { renderAsync } = docxModule;

        // Clear previous content
        containerRef.current.innerHTML = '';

        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: 'docx-wrapper',
          inWrapper: true,
          ignoreFonts: false,
          breakPages: false,
          useMathML: true,
          experimental: true,
        });

        if (!cancelled) setLoading(false);

        cleanup = () => {
          if (containerRef.current) containerRef.current.innerHTML = '';
        };
      } catch (e) {
        console.error('DOCX preview error:', e);
        if (!cancelled) {
          setError('Unable to render DOCX preview.');
          setLoading(false);
        }
      }
    }

    renderDocx();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [url]);

  return (
    <div className={cn('w-full border border-primary/20 rounded-lg bg-background/30', className)} style={{ height }}>
      {loading && !error && (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="mt-3 text-sm text-muted-foreground">Loading document…</p>
        </div>
      )}

      {error && (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
          <FileText className="w-10 h-10 text-primary mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn('w-full h-full overflow-auto px-4 py-6 docx-container')}
        style={{ display: loading || error ? 'none' : 'block' }}
      />

      <style>{`
        .docx-container .docx-wrapper { 
          color: hsl(var(--foreground));
        }
        .docx-container .docx-wrapper a { color: hsl(var(--primary)); }
        .docx-container .docx-wrapper p { margin: 0.25rem 0; }
        .docx-container .docx-wrapper table { border-collapse: collapse; }
        .docx-container .docx-wrapper table td, 
        .docx-container .docx-wrapper table th { border-color: hsl(var(--border)); }
      `}</style>
    </div>
  );
};