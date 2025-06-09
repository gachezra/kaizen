
import { NextResponse } from 'next/server';
import { getBlogPosts } from '@/lib/firebase/firestore';
import type { BlogPost } from '@/types';
import type { Timestamp } from 'firebase/firestore';

// Helper function to convert Timestamp to a JSON-serializable format (ISO string)
// and add the isEdited flag
const serializeBlogPost = (post: BlogPost): any => {
  const createdAtMillis = post.createdAt ? ((post.createdAt as Timestamp).toMillis ? (post.createdAt as Timestamp).toMillis() : new Date(post.createdAt).getTime()) : 0;
  const lastEditedAtMillis = post.lastEditedAt ? ((post.lastEditedAt as Timestamp).toMillis ? (post.lastEditedAt as Timestamp).toMillis() : new Date(post.lastEditedAt).getTime()) : 0;

  const isEdited = lastEditedAtMillis > createdAtMillis;

  return {
    ...post,
    createdAt: post.createdAt ? ((post.createdAt as Timestamp).toDate ? (post.createdAt as Timestamp).toDate().toISOString() : new Date(post.createdAt).toISOString()) : null,
    lastEditedAt: post.lastEditedAt ? ((post.lastEditedAt as Timestamp).toDate ? (post.lastEditedAt as Timestamp).toDate().toISOString() : new Date(post.lastEditedAt).toISOString()) : null,
    isEdited,
  };
};

const allowedOrigin = 'https://www.kaizenmartialartskenya.org';

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
    const posts = await getBlogPosts();
    const serializedPosts = posts.map(serializeBlogPost);
    return NextResponse.json(serializedPosts, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({ message: "Failed to fetch blog posts", error: (error as Error).message }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin, // Also set for error responses
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}
