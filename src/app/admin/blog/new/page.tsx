"use client";

import BlogForm from '../(components)/blog-form';
import { createBlogPost } from '@/lib/firebase/firestore';
import type { BlogPost } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewBlogPostPage() {
  const handleSubmit = async (data: BlogPost) => {
    const { id, createdAt, lastEditedAt, ...postDataToCreate } = data;
    await createBlogPost(postDataToCreate);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Create New Blog Post</h1>
        <p className="text-muted-foreground">Craft your new blog post using the form below.</p>
      </div>
      <Card className="shadow-lg">
         <CardHeader>
            <CardTitle className="font-headline">Post Content & Settings</CardTitle>
            <CardDescription>Fill in all required fields to create a new blog post.</CardDescription>
        </CardHeader>
        <CardContent>
          <BlogForm onSubmit={handleSubmit} isEditing={false} />
        </CardContent>
      </Card>
    </div>
  );
}
