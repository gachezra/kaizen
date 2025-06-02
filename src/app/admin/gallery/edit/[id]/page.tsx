"use client";

import React, { useEffect, useState } from 'react';
import GalleryForm from '../../(components)/gallery-form';
import { getGalleryEvent, updateGalleryEvent } from '@/lib/firebase/firestore';
import type { GalleryEvent } from '@/types';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface EditGalleryEventPageProps {
  params: { id: string };
}

export default function EditGalleryEventPage({ params }: EditGalleryEventPageProps) {
  const { id } = params;
  const [event, setEvent] = useState<GalleryEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        setIsLoading(true);
        try {
          const fetchedEvent = await getGalleryEvent(id as string);
          if (fetchedEvent) {
            setEvent(fetchedEvent);
          } else {
            toast({ title: "Error", description: "Gallery event not found.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Error fetching gallery event:", error);
          toast({ title: "Error", description: "Could not fetch gallery event details.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id, toast]);

  const handleSubmit = async (data: GalleryEvent) => {
    if (!id) return;
    // Firestore update function expects partial data
    await updateGalleryEvent(id as string, data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Edit Gallery Event</h1>
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <p className="text-muted-foreground">Gallery event not found or could not be loaded.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Edit Gallery Event</h1>
        <p className="text-muted-foreground">Update the details for the gallery event: "{event.title}".</p>
      </div>
      <Card className="shadow-lg">
         <CardHeader>
            <CardTitle className="font-headline">Event Details</CardTitle>
            <CardDescription>Modify the information and images for this gallery event.</CardDescription>
        </CardHeader>
        <CardContent>
            <GalleryForm initialData={event} onSubmit={handleSubmit} isEditing={true} />
        </CardContent>
      </Card>
    </div>
  );
}
