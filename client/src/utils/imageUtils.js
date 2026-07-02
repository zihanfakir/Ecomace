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

        const base64String = canvas.toDataURL('image/jpeg', quality);
        resolve(base64String);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Compresses an image and uploads it directly to ImgBB.
 */
export const uploadToImgBB = async (file, maxWidth = 800, quality = 0.7) => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('ImgBB API key is not configured. Please set VITE_IMGBB_API_KEY.');
  }

  // Compress the image
  const base64String = await compressImage(file, maxWidth, quality);

  // ImgBB expects raw base64 without the data URL prefix
  const base64Data = base64String.split(',')[1];

  // Upload directly to ImgBB using application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('image', base64Data);

  const response = await axios.post(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  if (response.data && response.data.success && response.data.data?.url) {
    return response.data.data.url;
  } else {
    throw new Error(response.data?.error?.message || 'ImgBB upload failed');
  }
};
