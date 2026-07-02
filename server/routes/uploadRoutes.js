const express = require('express');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Server configuration error: ImgBB API key is missing' });
    }

    // Use native fetch and FormData to proxy the upload to ImgBB
    const formData = new FormData();
    formData.append('image', image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData
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
