import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  className?: string;
}

const ImageUpload = ({ currentImageUrl, onImageChange, className }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const processAndResizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set consistent dimensions (16:9 aspect ratio)
        const targetWidth = 800;
        const targetHeight = 450;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        if (!ctx) return;

        // Calculate scaling and positioning for "object-fit: cover" behavior
        const sourceAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (sourceAspect > targetAspect) {
          // Image is wider - scale by height and center horizontally
          drawHeight = targetHeight;
          drawWidth = img.width * (targetHeight / img.height);
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller - scale by width and center vertically
          drawWidth = targetWidth;
          drawHeight = img.height * (targetWidth / img.width);
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        }

        // Fill background with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw the scaled and centered image
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(processedFile);
          }
        }, 'image/jpeg', 0.85);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Process and resize the image
      const processedFile = await processAndResizeImage(file);
      
      // Generate unique filename
      const fileExt = 'jpg'; // We always convert to JPG
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('event-thumbnails')
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-thumbnails')
        .getPublicUrl(data.path);

      setPreviewUrl(publicUrl);
      onImageChange(publicUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange('');
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium">Event Thumbnail</Label>
      <div className="mt-2 space-y-3">
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Thumbnail preview"
              className="w-full h-40 object-cover rounded-lg border-2 border-dashed border-gray-300"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleRemoveImage}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-2 left-2">
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                <Check className="h-3 w-3" />
                Optimized (800x450)
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="thumbnail-upload"
            />
            <label
              htmlFor="thumbnail-upload"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">
                    {uploading ? 'Processing...' : 'Click to upload'}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG or WEBP (MAX. 5MB)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Will be auto-resized to 800x450 (16:9)
                </p>
              </div>
            </label>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>• Images will be automatically resized to 800x450 pixels (16:9 aspect ratio)</p>
          <p>• All images will display consistently regardless of original dimensions</p>
          <p>• Supported formats: JPG, PNG, WEBP</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;