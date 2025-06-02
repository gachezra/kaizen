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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, ArrowLeft, Tag } from 'lucide-react';
import ImageUploader, { UploadedImage } from '@/components/ImageUploader';
import MarkdownEditor from './markdown-editor';
import type { BlogPost, CloudinaryImage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { deleteFromCloudinary as deleteImageAction } from '@/actions/cloudinaryActions';

const blogFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(150),
  author: z.string().min(2, "Author name is required.").max(50),
  slug: z.string().min(3, "Slug is required, auto-generated if empty.").max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters.").max(300),
  tags: z.string().refine(value => {
    if (!value.trim()) return true; // Allow empty tags string
    const tagsArray = value.split(',').map(tag => tag.trim());
    return tagsArray.every(tag => tag.length > 0 && tag.length <= 20);
  }, "Tags should be comma-separated, each tag max 20 chars."),
  imageSlideshow: z.array(z.object({
    secure_url: z.string(),
    public_id: z.string(),
    order: z.number(),
    id: z.string(),
  })).optional(),
  contentMarkdown: z.string().min(50, "Content must be at least 50 characters."),
  status: z.enum(['draft', 'published']),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

interface BlogFormProps {
  initialData?: BlogPost | null;
  onSubmit: (data: BlogPost) => Promise<void>;
  isEditing?: boolean;
}

const BlogForm: React.FC<BlogFormProps> = ({ initialData, onSubmit, isEditing = false }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const generateSlug = (title: string) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      author: initialData?.author || '',
      slug: initialData?.slug || '',
      excerpt: initialData?.excerpt || '',
      tags: initialData?.tags?.join(', ') || '',
      imageSlideshow: initialData?.imageSlideshow?.map((img, idx) => ({ ...img, id: img.public_id || `initial-${idx}` })) || [],
      contentMarkdown: initialData?.contentMarkdown || '',
      status: initialData?.status || 'draft',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        author: initialData.author,
        slug: initialData.slug,
        excerpt: initialData.excerpt,
        tags: initialData.tags?.join(', ') || '',
        imageSlideshow: initialData.imageSlideshow?.map((img, idx) => ({ ...img, id: img.public_id || `initial-${idx}`})) || [],
        contentMarkdown: initialData.contentMarkdown,
        status: initialData.status,
      });
    }
  }, [initialData, form]);
  
  const titleValue = form.watch('title');
  useEffect(() => {
    if (titleValue && !form.getValues('slug') && !isEditing) { // Only auto-slug for new posts if slug is empty
        form.setValue('slug', generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, form, isEditing]);


  const handleFormSubmit = async (data: BlogFormValues) => {
    setIsLoading(true);
    try {
      const blogPostData: BlogPost = {
        ...initialData, // Preserve id if editing
        title: data.title,
        author: data.author,
        slug: data.slug || generateSlug(data.title),
        excerpt: data.excerpt,
        tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        imageSlideshow: data.imageSlideshow?.map(img => ({
            secure_url: img.secure_url,
            public_id: img.public_id,
            order: img.order,
        })) || [],
        contentMarkdown: data.contentMarkdown,
        status: data.status,
      };
      await onSubmit(blogPostData);
      toast({
        title: `Blog Post ${isEditing ? 'Updated' : 'Created'}`,
        description: `The post "${data.title}" has been successfully ${isEditing ? 'updated' : 'saved'}.`,
      });
      router.push('/admin/blog');
    } catch (error: any) {
      toast({
        title: `Error ${isEditing ? 'Updating' : 'Creating'} Post`,
        description: error.message || `Could not ${isEditing ? 'update' : 'save'} the post.`,
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
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Post Title</Label>
          <Input id="title" {...form.register('title')} placeholder="e.g., Mastering the Roundhouse Kick" />
          {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author Name</Label>
          <Input id="author" {...form.register('author')} placeholder="Sensei John Doe" />
          {form.formState.errors.author && <p className="text-sm text-destructive">{form.formState.errors.author.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...form.register('slug')} placeholder="mastering-roundhouse-kick (auto-generated or custom)" />
        {form.formState.errors.slug && <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea id="excerpt" {...form.register('excerpt')} placeholder="A short summary of the post (max 300 characters)..." rows={3} />
        {form.formState.errors.excerpt && <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="tags" {...form.register('tags')} placeholder="e.g., training, kata, self-defense" className="pl-10" />
        </div>
        {form.formState.errors.tags && <p className="text-sm text-destructive">{form.formState.errors.tags.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Image Slideshow (Optional)</Label>
         <Controller
            name="imageSlideshow"
            control={form.control}
            render={({ field }) => (
                <ImageUploader
                    existingImages={field.value as UploadedImage[] || []}
                    onImagesChange={(newImages) => field.onChange(newImages)}
                    onImageDelete={handleCloudinaryImageDelete}
                />
            )}
        />
        {form.formState.errors.imageSlideshow && <p className="text-sm text-destructive">{form.formState.errors.imageSlideshow.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contentMarkdown">Content (Markdown)</Label>
        <Controller
          name="contentMarkdown"
          control={form.control}
          render={({ field }) => <MarkdownEditor value={field.value} onChange={field.onChange} />}
        />
        {form.formState.errors.contentMarkdown && <p className="text-sm text-destructive">{form.formState.errors.contentMarkdown.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditing ? 'Update Post' : 'Save Post'}
        </Button>
      </div>
    </form>
  );
};

export default BlogForm;
