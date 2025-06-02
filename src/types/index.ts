import type { Timestamp } from 'firebase/firestore';

export interface CloudinaryImage {
  secure_url: string;
  public_id: string;
  order: number; // For reordering
}

export interface GalleryEvent {
  id?: string; // Firestore document ID
  title: string;
  date: Timestamp | Date; // Store as Timestamp, handle as Date in forms
  description: string;
  images: CloudinaryImage[];
  thumbnailUrl?: string; 
  photoCount?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BlogPost {
  id?: string; // Firestore document ID
  title: string;
  author: string;
  slug: string;
  excerpt: string;
  tags: string[]; // Array of strings
  imageSlideshow: CloudinaryImage[];
  contentMarkdown: string;
  status: 'draft' | 'published';
  createdAt?: Timestamp;
  lastEditedAt?: Timestamp;
}
