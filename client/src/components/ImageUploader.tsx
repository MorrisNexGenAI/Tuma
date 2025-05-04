import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  maxFiles?: number;
  onImagesSelected?: (images: File[]) => void;
  existingImages?: string[];
  className?: string;
}

const ImageUploader = ({
  maxFiles = 3,
  onImagesSelected,
  existingImages = [],
  className = '',
}: ImageUploaderProps) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check file count
    if (files.length + images.length + existingImages.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} images.`,
        variant: "destructive"
      });
      return;
    }
    
    // Check file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Only image files are allowed.",
        variant: "destructive"
      });
    }
    
    // Create object URLs for previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Add files to state
    setImages(prev => {
      const updatedImages = [...prev, ...validFiles];
      if (onImagesSelected) {
        onImagesSelected(updatedImages);
      }
      return updatedImages;
    });
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
    // Remove the image from state
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setPreviews(newPreviews);
    setImages(newImages);
    
    if (onImagesSelected) {
      onImagesSelected(newImages);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const remainingSlots = maxFiles - (images.length + existingImages.length);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Images</h3>
        <span className="text-xs text-text-secondary">
          {remainingSlots} of {maxFiles} slots remaining
        </span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {/* Existing Images */}
        {existingImages.map((src, index) => (
          <div 
            key={`existing-${index}`} 
            className="relative h-24 w-24 rounded-md overflow-hidden border border-border group"
          >
            <img 
              src={src} 
              alt={`Existing upload ${index + 1}`} 
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        
        {/* New Image Previews */}
        {previews.map((src, index) => (
          <div 
            key={`preview-${index}`} 
            className="relative h-24 w-24 rounded-md overflow-hidden border border-border group"
          >
            <img 
              src={src} 
              alt={`Upload ${index + 1}`} 
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-red-500" />
            </button>
          </div>
        ))}
        
        {/* Upload Button (only if there are slots remaining) */}
        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={triggerFileInput}
            className="h-24 w-24 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center text-text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="h-6 w-6 mb-1" />
            <span className="text-xs text-center">Upload Image</span>
          </button>
        )}
      </div>
      
      <p className="text-xs text-text-secondary">
        Upload up to {maxFiles} images. Only image files are accepted.
      </p>
    </div>
  );
};

export default ImageUploader;