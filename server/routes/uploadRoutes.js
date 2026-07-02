const express = require('express');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
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
