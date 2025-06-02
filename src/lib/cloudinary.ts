import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function uploadToCloudinary(imageFile: File): Promise<CloudinaryUploadResult | null> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.error("Cloudinary environment variables not set.");
    throw new Error("Cloudinary environment variables not set.");
  }
  
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
    return {
      secure_url: response.data.secure_url,
      public_id: response.data.public_id,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    // It's better to throw the error so the caller can handle it,
    // possibly showing a specific message to the user.
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Cloudinary upload failed: ${error.response.data?.error?.message || error.message}`);
    }
    throw new Error("Cloudinary upload failed. Please check console for details.");
  }
}
