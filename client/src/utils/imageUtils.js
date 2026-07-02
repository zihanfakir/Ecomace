import axios from 'axios';

const API_BASE = 'https://ecomace.onrender.com';

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
 * Compresses an image and uploads it via server proxy to ImgBB.
 * Server-side proxy avoids CORS issues.
 */
export const uploadToImgBB = async (file, maxWidth = 800, quality = 0.7) => {
  // Compress first to save bandwidth
  const base64String = await compressImage(file, maxWidth, quality);

  // Remove the data URL prefix — ImgBB only wants the raw base64
  const base64Data = base64String.split(',')[1];

  // Send to our server proxy which forwards to ImgBB
  const response = await axios.post(
    `${API_BASE}/api/upload`,
    { image: base64Data },
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (response.data && response.data.url) {
    return response.data.url;
  } else {
    throw new Error('Invalid response from upload server');
  }
};
