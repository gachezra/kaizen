import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { GalleryEvent, BlogPost } from '@/types';

// Gallery Events
const galleryCollectionRef = collection(db, 'galleryEvents');

export const createGalleryEvent = async (eventData: Omit<GalleryEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(galleryCollectionRef, {
    ...eventData,
    date: Timestamp.fromDate(eventData.date instanceof Date ? eventData.date : new Date(eventData.date)),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getGalleryEvents = async (): Promise<GalleryEvent[]> => {
  const q = query(galleryCollectionRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryEvent));
};

export const getGalleryEvent = async (id: string): Promise<GalleryEvent | null> => {
  const docRef = doc(db, 'galleryEvents', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as GalleryEvent;
  }
  return null;
};

export const updateGalleryEvent = async (id: string, eventData: Partial<GalleryEvent>): Promise<void> => {
  const docRef = doc(db, 'galleryEvents', id);
  const updateData: any = { ...eventData, updatedAt: serverTimestamp() };
  if (eventData.date) {
    updateData.date = Timestamp.fromDate(eventData.date instanceof Date ? eventData.date : new Date(eventData.date));
  }
  await updateDoc(docRef, updateData);
};

export const deleteGalleryEvent = async (id: string): Promise<void> => {
  const docRef = doc(db, 'galleryEvents', id);
  await deleteDoc(docRef);
};

// Blog Posts
const blogCollectionRef = collection(db, 'blogPosts');

export const createBlogPost = async (postData: Omit<BlogPost, 'id' | 'createdAt' | 'lastEditedAt'>): Promise<string> => {
  const docRef = await addDoc(blogCollectionRef, {
    ...postData,
    createdAt: serverTimestamp(),
    lastEditedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getBlogPosts = async (): Promise<BlogPost[]> => {
  const q = query(blogCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
};

export const getBlogPost = async (id: string): Promise<BlogPost | null> => {
  const docRef = doc(db, 'blogPosts', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as BlogPost;
  }
  return null;
};

export const updateBlogPost = async (id: string, postData: Partial<BlogPost>): Promise<void> => {
  const docRef = doc(db, 'blogPosts', id);
  await updateDoc(docRef, { ...postData, lastEditedAt: serverTimestamp() });
};

export const deleteBlogPost = async (id: string): Promise<void> => {
  const docRef = doc(db, 'blogPosts', id);
  await deleteDoc(docRef);
};
