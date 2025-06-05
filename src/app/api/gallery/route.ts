
import { NextResponse } from 'next/server';
import { getGalleryEvents } from '@/lib/firebase/firestore';
import type { GalleryEvent } from '@/types';
import type { Timestamp } from 'firebase/firestore';

// Helper function to convert Timestamp to a JSON-serializable format (ISO string)
const serializeGalleryEvent = (event: GalleryEvent): any => {
  return {
    ...event,
    date: event.date ? ((event.date as Timestamp).toDate ? (event.date as Timestamp).toDate().toISOString() : new Date(event.date).toISOString()) : null,
    createdAt: event.createdAt ? ((event.createdAt as Timestamp).toDate ? (event.createdAt as Timestamp).toDate().toISOString() : new Date(event.createdAt).toISOString()) : null,
    updatedAt: event.updatedAt ? ((event.updatedAt as Timestamp).toDate ? (event.updatedAt as Timestamp).toDate().toISOString() : new Date(event.updatedAt).toISOString()) : null,
  };
};


export async function GET() {
  try {
    const events = await getGalleryEvents();
    const serializedEvents = events.map(serializeGalleryEvent);
    return NextResponse.json(serializedEvents, { status: 200 });
  } catch (error) {
    console.error("Error fetching gallery events:", error);
    return NextResponse.json({ message: "Failed to fetch gallery events", error: (error as Error).message }, { status: 500 });
  }
}
