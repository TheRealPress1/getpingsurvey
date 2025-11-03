import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ResumeViewer } from '@/components/ResumeViewer';
import { StarField } from '@/components/StarField';

const useQuery = () => new URLSearchParams(useLocation().search);

const ResumePreview: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const url = query.get('url') || '';
  const fileName = query.get('filename') || 'resume';

  return (
    <div className="min-h-screen bg-background relative">
      <StarField />
      <header className="border-b border-border p-4 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Back
          </Button>
          <h1 className="text-xl font-bold iridescent-text">Resume Preview</h1>
          <div />
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 relative z-10">
        {url ? (
          <ResumeViewer url={url} fileName={fileName} height={720} />
        ) : (
          <div className="p-6 text-center border border-destructive/30 rounded-xl">
            <p className="text-destructive">Missing resume URL</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResumePreview;
