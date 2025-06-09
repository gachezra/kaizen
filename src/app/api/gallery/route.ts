
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

const allowedOrigin = 'https://kaizenmartialartskenya.org';

export async function GET(request: Request) {
  // Preflight OPTIONS request handling
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const events = await getGalleryEvents();
    const serializedEvents = events.map(serializeGalleryEvent);
    return NextResponse.json(serializedEvents, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error("Error fetching gallery events:", error);
    return NextResponse.json({ message: "Failed to fetch gallery events", error: (error as Error).message }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin, // Also set for error responses
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}
