import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload an avatar image to Supabase Storage
 * @param userId - The user's ID (used in filename)
 * @param file - The file to upload
 * @returns The public URL of the uploaded image
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 2MB.');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${userId}-${Date.now()}.${fileExt}`;

  // Delete old avatar if exists (optional cleanup)
  try {
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list('', { search: userId });
    
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles
        .filter(f => f.name.startsWith(userId))
        .map(f => f.name);
      
      if (filesToDelete.length > 0) {
        await supabase.storage.from('avatars').remove(filesToDelete);
      }
    }
  } catch (e) {
    // Ignore cleanup errors
    console.log('Cleanup skipped:', e);
  }

  // Upload new avatar
  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image. Please try again.');
  }

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Delete an avatar from Supabase Storage
 * @param avatarUrl - The full URL of the avatar to delete
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const url = new URL(avatarUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    if (fileName) {
      await supabase.storage.from('avatars').remove([fileName]);
    }
  } catch (e) {
    console.error('Delete avatar error:', e);
  }
}
