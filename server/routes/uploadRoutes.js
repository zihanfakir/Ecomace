const express = require('express');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Limit to 15 uploads per hour per IP to prevent ImgBB API abuse
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { message: 'Too many image uploads from this IP, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', protect, uploadLimiter, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    // Verify size manually just in case it bypassed global body parser limits
    // Roughly 5MB limit (Base64 is ~33% larger than original, so 7MB string length limit)
    if (image.length > 7 * 1024 * 1024) {
      return res.status(413).json({ message: 'Image size exceeds the 5MB limit' });
    }

    // Use env variable if set, otherwise fall back to default key
    const apiKey = process.env.IMGBB_API_KEY || 'd56dbc5ab20a283240dd980bfb387a1a';

    // ImgBB requires application/x-www-form-urlencoded with base64 image
    const params = new URLSearchParams();
    params.append('image', image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();

    if (data.success) {
      res.json({ url: data.data.url });
    } else {
      res.status(400).json({ message: data.error?.message || 'ImgBB upload failed' });
    }
  } catch (error) {
    console.error('Upload proxy error:', error);
    res.status(500).json({ message: 'Internal server error during upload' });
  }
});

module.exports = router;
