/**
 * Compresses an image file and converts it to a base64 string.
 * @param {File} file - The image file to compress.
 * @param {number} maxWidth - The maximum width of the compressed image.
 * @param {number} quality - The quality of the JPEG output (0.0 to 1.0).
 * @returns {Promise<string>} - A promise that resolves to the base64 string.
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

        // Convert to base64, using JPEG for compression
        const base64String = canvas.toDataURL('image/jpeg', quality);
        resolve(base64String);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Compresses an image and uploads it to ImgBB.
 * @param {File} file - The image file to upload.
 * @param {number} maxWidth - The maximum width of the compressed image.
 * @param {number} quality - The quality of the JPEG output (0.0 to 1.0).
 * @returns {Promise<string>} - A promise that resolves to the ImgBB image URL.
 */
export const uploadToImgBB = async (file, maxWidth = 800, quality = 0.7) => {
  try {
    // First, compress the image to save bandwidth
    const base64String = await compressImage(file, maxWidth, quality);
    
    // ImgBB expects the raw base64 data without the data URL prefix
    const base64Data = base64String.split(',')[1];
    
    const formData = new FormData();
    formData.append('image', base64Data);
    
    // Using the provided API key
    const response = await fetch(`https://api.imgbb.com/1/upload?key=d56dbc5ab20a283240dd980bfb387a1a`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.url; // Return the direct URL to the image
    } else {
      throw new Error(data.error?.message || 'ImgBB upload failed');
    }
  } catch (error) {
    console.error('Upload to ImgBB error:', error);
    throw error;
  }
};
