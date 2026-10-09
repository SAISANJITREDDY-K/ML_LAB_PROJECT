import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  subtext?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Processing machine learning pipeline...',
  subtext,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1 max-w-sm">{subtext}</p>}
    </div>
  );
};
