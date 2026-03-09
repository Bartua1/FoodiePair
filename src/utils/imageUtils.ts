/**
 * Utility to get optimized image URLs from Supabase Storage.
 * Uses Supabase Image Transformation service.
 * 
 * @param url The original public URL of the image
 * @param options Transformation options (width, height, quality, format)
 * @returns Optimized URL
 */
export function getOptimizedImageUrl(
    url: string | null | undefined,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'webp' | 'origin';
        resize?: 'cover' | 'contain' | 'fill';
    } = {}
): string {
    if (!url) return '';
    
    // If it's not a Supabase storage URL, return as is
    if (!url.includes('storage.googleapis.com') && !url.includes('supabase.co')) {
        return url;
    }

    // Toggle optimization via env var (defaults to true for now, 
    // but the user can set it to false if images are failing)
    const enableOptimization = import.meta.env.VITE_ENABLE_IMAGE_OPTIMIZATION !== 'false';
    if (!enableOptimization) {
        return url;
    }

    try {
        const urlObj = new URL(url);
        const { width, height, quality = 80, format = 'webp', resize = 'cover' } = options;

        // Supabase Image Transformation format:
        // [project-url]/storage/v1/render/image/authenticated/[path]?width=[w]&height=[h]&quality=[q]&format=[f]&resize=[r]
        // Note: For public buckets, it's /render/image/public/
        
        const isPublic = url.includes('/public/');
        const bucketPath = url.split('/storage/v1/object/public/')[1] || url.split('/storage/v1/object/authenticated/')[1];
        
        if (!bucketPath) return url;

        const baseUrl = urlObj.origin;
        const renderPath = isPublic ? '/storage/v1/render/image/public/' : '/storage/v1/render/image/authenticated/';
        
        const params = new URLSearchParams();
        if (width) params.append('width', width.toString());
        if (height) params.append('height', height.toString());
        params.append('quality', quality.toString());
        params.append('format', format);
        params.append('resize', resize);

        return `${baseUrl}${renderPath}${bucketPath}?${params.toString()}`;
    } catch (e) {
        console.error('Error generating optimized image URL:', e);
        return url;
    }
}
