import axios from 'axios';

/**
 * Compresses an image file and converts it to a base64 string.
 */
export const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 JPEG
        const base64String = canvas.toDataURL('image/jpeg', quality);
        resolve(base64String);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Compresses an image and uploads it via the backend server proxy to ImgBB.
 * This avoids client-side IP blocks by ImgBB.
 */
export const uploadToImgBB = async (file, maxWidth = 800, quality = 0.7) => {
  // Compress first to save bandwidth
  const base64String = await compressImage(file, maxWidth, quality);

  // Remove the data URL prefix
  const base64Data = base64String.split(',')[1];

  const apiUrl = import.meta.env.VITE_API_URL || 'https://ecomace-9ntk.vercel.app';
  
  try {
    const response = await axios.post(`${apiUrl}/api/upload`, {
      image: base64Data
    });

    if (response.data && response.data.url) {
      return response.data.url;
    } else {
      throw new Error('Upload failed: Invalid response from backend');
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to upload via proxy';
    throw new Error(`Upload failed: ${errorMsg}`);
  }
};
