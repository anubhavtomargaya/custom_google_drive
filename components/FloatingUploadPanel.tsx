import { useState, useEffect } from 'react';
import BulkUploader from './BulkUploader';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface FloatingUploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onUploadStart?: () => void;
}

export default function FloatingUploadPanel({ 
  isOpen, 
  onClose, 
  onComplete,
  onUploadStart 
}: FloatingUploadPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Reset minimized state when panel is opened
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);
  
  // Handle upload progress updates from BulkUploader
  const handleProgressUpdate = (count: number, progress: number) => {
    setUploadCount(count);
    setUploadProgress(progress);
  };
  
  if (!isOpen) return null;
  
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 w-64 bg-white rounded-xl shadow-soft border border-earth-100 z-50 overflow-hidden transition-all duration-300 ease-in-out">
        <div className="p-3 flex items-center justify-between bg-sage-500 text-white">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">Uploading Files</span>
            <div className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{uploadCount}</div>
          </div>
          <div className="flex items-center space-x-1">
            {uploadProgress === 100 && (
              <button 
                onClick={() => {
                  onComplete();
                  toast.success('Files refreshed!');
                }}
                className="p-1 hover:bg-sage-600 rounded transition-colors"
                title="Refresh folder view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button 
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-sage-600 rounded transition-colors"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="w-full bg-earth-100 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-sage-400 to-sage-500 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-right mt-1 text-earth-500">
            {uploadProgress}% Complete
          </div>
          <div className="text-xs text-center mt-2">
            {uploadProgress === 100 ? (
              <span className="text-sage-600">Upload complete!</span>
            ) : (
              <span className="text-earth-500">Uploading files...</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-earth-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-medium border border-earth-100 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-earth-100">
          <h2 className="text-lg font-medium text-earth-800">Upload Files</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-500 transition-colors"
              title="Minimize"
            >
              <ArrowsPointingInIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-500 transition-colors"
              title="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
          <BulkUploader 
            onComplete={onComplete} 
            onCancel={onClose}
            onProgressUpdate={handleProgressUpdate}
            onUploadStart={onUploadStart}
          />
        </div>
      </div>
    </div>
  );
} 