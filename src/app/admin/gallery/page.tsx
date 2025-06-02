"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Edit3, Trash2, Image as ImageIcon, CalendarDays, Loader2 } from 'lucide-react';
import { getGalleryEvents, deleteGalleryEvent } from '@/lib/firebase/firestore';
import { deleteFromCloudinary } from '@/actions/cloudinaryActions';
import type { GalleryEvent, CloudinaryImage } from '@/types';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function GalleryPage() {
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const fetchedEvents = await getGalleryEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching gallery events:", error);
      toast({ title: "Error", description: "Could not fetch gallery events.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteEvent = async (eventId: string, images: CloudinaryImage[]) => {
    if (!eventId) return;
    try {
      // Delete images from Cloudinary first
      for (const image of images) {
        await deleteFromCloudinary(image.public_id);
      }
      // Then delete event from Firestore
      await deleteGalleryEvent(eventId);
      toast({ title: "Success", description: "Gallery event deleted successfully." });
      fetchEvents(); // Refresh list
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: "Error", description: "Could not delete gallery event.", variant: "destructive" });
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Gallery Management</h1>
          <p className="text-muted-foreground">Manage your club's photo gallery events.</p>
        </div>
        <Link href="/admin/gallery/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Gallery
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Gallery Events Yet</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first gallery event.</p>
            <Link href="/admin/gallery/new" passHref>
              <Button>Create New Gallery Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0 relative aspect-video">
                {event.images && event.images.length > 0 ? (
                  <Image
                    src={event.images.sort((a,b) => a.order - b.order)[0].secure_url}
                    alt={event.title}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="event photo martial arts"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                 <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/gallery/edit/${event.id}`}>
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
                              This action will permanently delete the gallery event "{event.title}" and all its images from Cloudinary. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEvent(event.id!, event.images)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg font-semibold mb-1 line-clamp-2 font-headline">{event.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground flex items-center mb-2">
                  <CalendarDays className="mr-1.5 h-4 w-4" />
                  {event.date ? format(new Date((event.date as any).seconds * 1000), 'MMMM dd, yyyy') : 'N/A'}
                </CardDescription>
                <CardDescription className="text-sm line-clamp-3">{event.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0 border-t mt-auto">
                 <p className="text-xs text-muted-foreground">{event.images?.length || 0} photos</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
