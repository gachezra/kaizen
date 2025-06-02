"use server";

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function deleteFromCloudinary(publicId: string): Promise<{ success: boolean; error?: string }> {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Cloudinary API Key or Secret not configured for server-side deletion.");
    return { success: false, error: "Server configuration error." };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok' || result.result === 'not found') { // 'not found' can be treated as success if we just want it gone
      return { success: true };
    }
    console.error("Cloudinary deletion failed:", result);
    return { success: false, error: result.result || "Unknown error during deletion." };
  } catch (error: any) {
    console.error("Error deleting from Cloudinary:", error);
    return { success: false, error: error.message || "Exception during Cloudinary deletion." };
  }
}
