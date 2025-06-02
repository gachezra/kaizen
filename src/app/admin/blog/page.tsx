"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Edit3, Trash2, FileText, Loader2 } from 'lucide-react';
import { getBlogPosts, deleteBlogPost } from '@/lib/firebase/firestore';
import { deleteFromCloudinary } from '@/actions/cloudinaryActions';
import type { BlogPost, CloudinaryImage } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from '@/components/ui/card';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const fetchedPosts = await getBlogPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      toast({ title: "Error", description: "Could not fetch blog posts.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDeletePost = async (postId: string, images: CloudinaryImage[]) => {
    if (!postId) return;
    try {
      for (const image of images) {
        await deleteFromCloudinary(image.public_id);
      }
      await deleteBlogPost(postId);
      toast({ title: "Success", description: "Blog post deleted successfully." });
      fetchPosts(); // Refresh list
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error", description: "Could not delete blog post.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Blog Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage your club's blog posts.</p>
        </div>
        <Link href="/admin/blog/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
         <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Blog Posts Yet</h3>
            <p className="text-muted-foreground mb-4">Start sharing news and updates by creating your first blog post.</p>
            <Link href="/admin/blog/new" passHref>
              <Button>Create New Blog Post</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Last Edited</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'} 
                           className={post.status === 'published' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.createdAt ? format(new Date((post.createdAt as any).seconds * 1000), 'PP') : 'N/A'}</TableCell>
                  <TableCell>{post.lastEditedAt ? format(new Date((post.lastEditedAt as any).seconds * 1000), 'PPp') : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/blog/edit/${post.id}`}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                               <Trash2 className="mr-2 h-4 w-4" /> Delete
                             </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will permanently delete the blog post "{post.title}" and all its slideshow images from Cloudinary. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePost(post.id!, post.imageSlideshow)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
