"use client";

import React, { useState, useCallback, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { X, UploadCloud, ArrowUp, ArrowDown, GripVertical, Trash2 } from 'lucide-react';
import { uploadToCloudinary, CloudinaryUploadResult } from '@/lib/cloudinary';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

export interface UploadedImage extends CloudinaryUploadResult {
  file?: File; // Original file, optional
  order: number;
  id: string; // A unique ID for react key prop, can be public_id or generated
}

interface ImageUploaderProps {
  existingImages?: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onImageDelete?: (publicId: string) => Promise<{success: boolean, error?: string}>; // For Cloudinary deletion
  maxFiles?: number;
  maxFileSizeMB?: number; // Max file size in MB
  aspectRatio?: string; // e.g. "16/9" or "1/1" for preview styling
  isMobileResponsive?: boolean; // For gallery specific requirement
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  existingImages = [],
  onImagesChange,
  onImageDelete,
  maxFiles = 10,
  maxFileSizeMB = 5,
  aspectRatio = "16/9",
  isMobileResponsive = false,
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(() => 
    existingImages.map((img, idx) => ({ ...img, order: img.order ?? idx, id: img.public_id || `existing-${idx}` }))
  );
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (uploadedImages.length + files.length > maxFiles) {
      toast({ title: "Upload Limit Exceeded", description: `You can upload a maximum of ${maxFiles} images.`, variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const newImages: UploadedImage[] = [...uploadedImages];
    let currentOrder = newImages.length > 0 ? Math.max(...newImages.map(img => img.order)) + 1 : 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = `uploading-${Date.now()}-${i}`;

      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast({ title: "File Too Large", description: `${file.name} exceeds the ${maxFileSizeMB}MB size limit.`, variant: "destructive" });
        continue;
      }
      
      // Add to list for preview with progress
      newImages.push({ secure_url: URL.createObjectURL(file), public_id: tempId, file, order: currentOrder, id: tempId });
      setUploadedImages([...newImages]); // Update UI to show placeholder
      currentOrder++;

      try {
        // Simulate progress for demo, Cloudinary SDK might offer progress events
        setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress <= 90) { // Stop at 90 to wait for actual upload
            setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
          } else {
            clearInterval(interval);
          }
        }, 100);

        const result = await uploadToCloudinary(file);
        clearInterval(interval); // Clear simulated progress

        if (result) {
          const uploadedImageIndex = newImages.findIndex(img => img.id === tempId);
          if (uploadedImageIndex !== -1) {
            newImages[uploadedImageIndex] = { ...result, order: newImages[uploadedImageIndex].order, id: result.public_id };
          }
          setUploadProgress(prev => ({ ...prev, [tempId]: 100 }));
          toast({ title: "Upload Successful", description: `${file.name} uploaded.` });
        } else {
          throw new Error("Upload failed, result is null");
        }
      } catch (error: any) {
        const failedImageIndex = newImages.findIndex(img => img.id === tempId);
        if (failedImageIndex !== -1) newImages.splice(failedImageIndex, 1); // Remove failed upload
        
        toast({ title: "Upload Failed", description: `Error uploading ${file.name}: ${error.message}`, variant: "destructive" });
        setUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });
      }
    }
    
    // Filter out any temporary placeholders if upload failed before result
    const finalImages = newImages.filter(img => img.id !== img.public_id || img.public_id.startsWith("existing-"));
    
    setUploadedImages(finalImages.sort((a,b) => a.order - b.order));
    onImagesChange(finalImages.sort((a,b) => a.order - b.order));
    setIsUploading(false);
     // Reset file input to allow re-uploading the same file if needed
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleRemoveImage = async (publicIdToRemove: string) => {
    const imageToRemove = uploadedImages.find(img => img.public_id === publicIdToRemove);
    if (!imageToRemove) return;

    if (onImageDelete && !publicIdToRemove.startsWith("uploading-")) { // Only delete from Cloudinary if it's an actual public_id
      try {
        const result = await onImageDelete(publicIdToRemove);
        if (!result.success) {
          toast({ title: "Deletion Failed on Cloudinary", description: result.error || "Could not delete image from Cloudinary.", variant: "destructive" });
          return; // Don't remove from UI if server deletion fails
        }
         toast({ title: "Image Deleted", description: "Image removed from Cloudinary." });
      } catch (error: any) {
        toast({ title: "Deletion Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    const updatedImages = uploadedImages.filter(img => img.public_id !== publicIdToRemove)
      .map((img, idx) => ({ ...img, order: idx })); // Re-assign order
    
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...uploadedImages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    // Swap order properties
    const tempOrder = newImages[index].order;
    newImages[index].order = newImages[targetIndex].order;
    newImages[targetIndex].order = tempOrder;
    
    const sortedImages = newImages.sort((a, b) => a.order - b.order);
    setUploadedImages(sortedImages);
    onImagesChange(sortedImages);
  };

  const responsiveClasses = isMobileResponsive 
    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" 
    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-muted hover:border-primary bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-primary" />
              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-muted-foreground">Max {maxFiles} images, up to {maxFileSizeMB}MB each</p>
            </div>
            <Input 
              id="file-upload" 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
              disabled={isUploading || uploadedImages.length >= maxFiles}
            />
          </label>
        </CardContent>
      </Card>

      {uploadedImages.length > 0 && (
        <div className={`grid gap-4 ${responsiveClasses}`}>
          {uploadedImages.map((image, index) => (
            <div key={image.id} className="relative group aspect-video rounded-md overflow-hidden shadow-md border border-muted">
              <Image
                src={image.secure_url}
                alt={`Uploaded image ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="uploaded club event"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 space-y-1">
                <div className="flex space-x-1">
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-white/80 hover:bg-white" onClick={() => moveImage(index, 'up')} disabled={index === 0}>
                    <ArrowUp className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-white/80 hover:bg-white" onClick={() => moveImage(index, 'down')} disabled={index === uploadedImages.length - 1}>
                    <ArrowDown className="h-4 w-4 text-primary" />
                  </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-7 w-7">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will remove the image. If it's already saved, it will also be deleted from Cloudinary. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveImage(image.public_id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {/* <span className="text-xs text-white bg-black/50 px-1 rounded">Order: {image.order + 1}</span> */}
              </div>
              {uploadProgress[image.id] !== undefined && uploadProgress[image.id] < 100 && (
                <div className="absolute bottom-0 left-0 right-0 p-1">
                  <Progress value={uploadProgress[image.id]} className="h-1 w-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

