"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ImageUploader, { UploadedImage } from '@/components/ImageUploader';
import type { GalleryEvent, CloudinaryImage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import { deleteFromCloudinary as deleteImageAction } from '@/actions/cloudinaryActions';

const galleryFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(100),
  date: z.date({ required_error: "Event date is required." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(5000),
  images: z.array(z.object({
    secure_url: z.string(),
    public_id: z.string(),
    order: z.number(),
    id: z.string(), // id is used for React key, can be public_id
  })).min(1, { message: "At least one image is required." }),
});

type GalleryFormValues = z.infer<typeof galleryFormSchema>;

interface GalleryFormProps {
  initialData?: GalleryEvent | null;
  onSubmit: (data: GalleryEvent) => Promise<void>;
  isEditing?: boolean;
}

const GalleryForm: React.FC<GalleryFormProps> = ({ initialData, onSubmit, isEditing = false }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      date: initialData?.date ? (initialData.date as Timestamp).toDate() : new Date(),
      description: initialData?.description || '',
      images: initialData?.images?.map((img, idx) => ({ ...img, id: img.public_id || `initial-${idx}` })) || [],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        date: (initialData.date as Timestamp).toDate(),
        description: initialData.description,
        images: initialData.images?.map((img, idx) => ({ ...img, id: img.public_id || `initial-${idx}`})) || [],
      });
    }
  }, [initialData, form]);

  const handleFormSubmit = async (data: GalleryFormValues) => {
    setIsLoading(true);
    try {
      const galleryEventData: GalleryEvent = {
        ...initialData, // preserve id if editing
        title: data.title,
        // date is already a Date object from react-hook-form with zod
        date: data.date, 
        description: data.description,
        images: data.images.map(img => ({ // Ensure we only pass CloudinaryImage fields
            secure_url: img.secure_url,
            public_id: img.public_id,
            order: img.order,
        })),
        photoCount: data.images.length,
      };
      await onSubmit(galleryEventData);
      toast({
        title: `Gallery Event ${isEditing ? 'Updated' : 'Created'}`,
        description: `The event "${data.title}" has been successfully ${isEditing ? 'updated' : 'saved'}.`,
      });
      router.push('/admin/gallery');
    } catch (error: any) {
      toast({
        title: `Error ${isEditing ? 'Updating' : 'Creating'} Event`,
        description: error.message || `Could not ${isEditing ? 'update' : 'save'} the event.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloudinaryImageDelete = async (publicId: string) => {
     return deleteImageAction(publicId);
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input id="title" {...form.register('title')} placeholder="e.g., Annual Summer Camp" />
        {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Event Date</Label>
        <Controller
          name="date"
          control={form.control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {form.formState.errors.date && <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Event Description</Label>
        <Textarea id="description" {...form.register('description')} placeholder="A brief description of the event..." rows={5} />
        {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <Controller
            name="images"
            control={form.control}
            render={({ field }) => (
                <ImageUploader
                    existingImages={field.value as UploadedImage[]}
                    onImagesChange={(newImages) => field.onChange(newImages)}
                    onImageDelete={handleCloudinaryImageDelete}
                    isMobileResponsive={true} // As per requirement
                />
            )}
        />
        {form.formState.errors.images && <p className="text-sm text-destructive">{form.formState.errors.images.message}</p>}
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditing ? 'Update Event' : 'Save Event'}
        </Button>
      </div>
    </form>
  );
};

export default GalleryForm;
