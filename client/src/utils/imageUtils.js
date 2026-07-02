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
 * Compresses an image and uploads it directly to ImgBB.
 * Uploading directly from the client avoids backend sleep timeouts and CORS issues.
 */
export const uploadToImgBB = async (file, maxWidth = 800, quality = 0.7) => {
  // Compress first to save bandwidth
  const base64String = await compressImage(file, maxWidth, quality);

  // Remove the data URL prefix — ImgBB only wants the raw base64
  const base64Data = base64String.split(',')[1];

  // Hardcode the API key provided by the user to ensure it works on any deployment
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY || 'd56dbc5ab20a283240dd980bfb387a1a';

  // ImgBB requires application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('image', base64Data);

  // Upload directly to ImgBB
  const response = await axios.post(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  if (response.data && response.data.data && response.data.data.url) {
    return response.data.data.url;
  } else {
    throw new Error('ImgBB upload failed');
  }
};
