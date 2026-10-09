import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDataset } from '../../services/api';
import { DatasetMeta } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dataset: DatasetMeta) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file type. Please upload a CSV file (.csv).');
      setSelectedFile(null);
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      setError('File size exceeds the 16MB limit.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const dataset = await uploadDataset(selectedFile);
      setUploading(false);
      setSelectedFile(null);
      onSuccess(dataset);
      onClose();
    } catch (err: any) {
      setUploading(false);
      setError(err.message || 'Upload failed. Please check the CSV format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upload Dataset</h3>
            <p className="text-xs text-slate-500 mt-0.5">Upload any tabular dataset in CSV format</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50/20'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".csv"
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800 truncate max-w-xs">{selectedFile.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <span className="text-[11px] text-indigo-600 mt-2 font-medium hover:underline">
                Click to choose a different file
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Click to browse or drag and drop CSV
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Maximum file size: 16 MB</p>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Dataset Requirements:</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-500">
            <li>Comma-separated values (.csv) with header column row</li>
            <li>UTF-8, Latin-1, or standard encoding</li>
            <li>At least 2 columns and 10 rows for meaningful ML training</li>
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-xs"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Parsing & Validating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Upload Dataset</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
