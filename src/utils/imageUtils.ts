/**
 * Utility to get optimized image URLs from Supabase Storage.
 * Note: Free Tier does not support server-side transformations.
 */
export function getOptimizedImageUrl(
    url: string | null | undefined,
    _options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'webp' | 'origin';
        resize?: 'cover' | 'contain' | 'fill';
    } = {}
): string {
    if (!url) return '';
    
    // Server-side transformations are disabled on Free Tier.
    // We rely on client-side compression during upload.
    return url;
}

/**
 * Compresses an image client-side using Canvas API.
 * @param file The original image File
 * @param maxWidth Max width/height of the output
 * @param quality Compression quality (0 to 1)
 * @returns Compressed Blob
 */
export async function compressImage(
    file: File, 
    maxWidth: number = 1200, 
    quality: number = 0.7
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width *= maxWidth / height;
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas toBlob failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}
