
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  acceptedFileTypes?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  acceptedFileTypes = '.pdf,.docx,.txt'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file: File) => {
    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    // Currently we only support TXT files for actual content extraction
    // In a real app, we'd use libraries to parse PDF and DOCX
    if (!fileType || !acceptedFileTypes.includes(`.${fileType}`)) {
      toast({
        title: 'Invalid File Type',
        description: `Please upload a PDF, DOCX, or TXT file.`,
        variant: 'destructive'
      });
      return;
    }
    
    if (fileType !== 'txt') {
      toast({
        title: 'Limited Support',
        description: `Currently full text extraction is only supported for TXT files. For PDF and DOCX, only partial content might be extracted.`,
        variant: 'warning'
      });
    }
    
    setSelectedFile(file);
    simulateUpload(file);
  };
  
  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          onFileSelected(file);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {!selectedFile && (
        <div
          className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          } hover:border-primary/70 hover:bg-primary/5`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Drag & Drop Your File</h3>
              <p className="text-sm text-muted-foreground">
                Support for PDF, DOCX, or TXT files
              </p>
              <p className="text-xs text-muted-foreground">
                (Best results with TXT files)
              </p>
            </div>
            <div className="flex items-center mt-4">
              <Button 
                variant="outline" 
                onClick={triggerFileInput}
                className="flex items-center space-x-2"
              >
                <FileUp className="h-4 w-4" />
                <span>Select File</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="border rounded-xl p-6 space-y-4 transition-all duration-300 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium truncate max-w-[200px] sm:max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Uploading</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1.5" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
