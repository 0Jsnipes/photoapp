const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary configuration from environment variables
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up multer for file uploads (for multiple files)
const upload = multer({ dest: 'uploads/' });

// Endpoint to handle multiple file uploads
app.post('/upload', upload.array('photos', 10), async (req, res) => {
    const filePaths = req.files.map(file => file.path);
    
    try {
        // Upload all files to Cloudinary
        const uploadPromises = filePaths.map(filePath =>
            cloudinary.uploader.upload(filePath, { public_id: path.basename(filePath, path.extname(filePath)) })
        );
        const results = await Promise.all(uploadPromises);

        // Delete the local files after upload
        filePaths.forEach(filePath => fs.unlinkSync(filePath));

        // Send the Cloudinary URLs to the client
        const imageUrls = results.map(result => result.secure_url);
        res.json({ imageUrls });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send('Error uploading files');
    }
});

// Root route to serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
