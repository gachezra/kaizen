"use client";

import React, { useEffect, useState } from 'react';
import BlogForm from '../../(components)/blog-form';
import { getBlogPost, updateBlogPost } from '@/lib/firebase/firestore';
import type { BlogPost } from '@/types';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface EditBlogPostPageProps {
  params: { id: string };
}

export default function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = params;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        setIsLoading(true);
        try {
          const fetchedPost = await getBlogPost(id as string);
          if (fetchedPost) {
            setPost(fetchedPost);
          } else {
             toast({ title: "Error", description: "Blog post not found.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Error fetching blog post:", error);
          toast({ title: "Error", description: "Could not fetch blog post details.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, toast]);

  const handleSubmit = async (data: BlogPost) => {
    if (!id) return;
    await updateBlogPost(id as string, data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
     return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Edit Blog Post</h1>
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <p className="text-muted-foreground">Blog post not found or could not be loaded.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Edit Blog Post</h1>
        <p className="text-muted-foreground">Update the content and settings for your blog post: "{post.title}".</p>
      </div>
      <Card className="shadow-lg">
         <CardHeader>
            <CardTitle className="font-headline">Post Content & Settings</CardTitle>
            <CardDescription>Modify the details for this blog post.</CardDescription>
        </CardHeader>
        <CardContent>
         <BlogForm initialData={post} onSubmit={handleSubmit} isEditing={true} />
        </CardContent>
      </Card>
    </div>
  );
}
