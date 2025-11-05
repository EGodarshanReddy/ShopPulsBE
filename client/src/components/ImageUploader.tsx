import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  maxImages?: number;
  images?: string[];
  onChange: (images: string[]) => void;
  className?: string;
}

export function ImageUploader({ 
  maxImages = 3, 
  images = [], 
  onChange,
  className
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    if (images.length + files.length > maxImages) {
      setErrorMessage(`You can only upload up to ${maxImages} images`);
      return;
    }
    
    setErrorMessage(null);
    
    // Convert files to base64 strings
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImages = [...images, event.target.result.toString()];
          onChange(newImages);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };
  
  const openFileSelector = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-3">
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square">
            <Card className="w-full h-full overflow-hidden">
              <img 
                src={image} 
                alt={`Uploaded ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            </Card>
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow-sm hover:bg-white"
            >
              <span className="material-icons text-sm text-red-500">close</span>
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <div 
            className={cn(
              "aspect-square border-2 border-dashed border-neutral-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary transition-colors",
              errorMessage && "border-red-500"
            )}
            onClick={openFileSelector}
          >
            <span className="material-icons text-neutral-400">add_photo_alternate</span>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      
      {errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
