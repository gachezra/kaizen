"use client";

import GalleryForm from '../(components)/gallery-form';
import { createGalleryEvent } from '@/lib/firebase/firestore';
import type { GalleryEvent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewGalleryEventPage() {
  const handleSubmit = async (data: GalleryEvent) => {
    // Firestore function expects data without id, createdAt, updatedAt for new doc
    const { id, createdAt, updatedAt, ...eventDataToCreate } = data;
    await createGalleryEvent(eventDataToCreate);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Create New Gallery Event</h1>
        <p className="text-muted-foreground">Fill in the details below to add a new event to the gallery.</p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Event Details</CardTitle>
            <CardDescription>Provide information and images for the new gallery event.</CardDescription>
        </CardHeader>
        <CardContent>
            <GalleryForm onSubmit={handleSubmit} isEditing={false} />
        </CardContent>
      </Card>
    </div>
  );
}
