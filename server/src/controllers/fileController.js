const File = require('../models/File');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    let thumbnailPath = null;

    // Generate thumbnail for images
    if (req.file.mimetype.startsWith('image/')) {
      const thumbnailFilename = `thumb_${req.file.filename}`;
      thumbnailPath = path.join(process.env.UPLOAD_DIR, thumbnailFilename);
      
      await sharp(req.file.path)
        .resize(200, 200, { fit: 'cover' })
        .toFile(thumbnailPath);
        
      thumbnailPath = `${req.protocol}://${req.get('host')}/uploads/${thumbnailFilename}`;
    }

    // Get highest position for ordering
    const highestPosition = await File.findOne({ owner: req.user._id })
      .sort('-position')
      .select('position');
    
    const newPosition = (highestPosition?.position || 0) + 1;

    const file = new File({
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: fileUrl,
      thumbnail: thumbnailPath,
      owner: req.user._id,
      position: newPosition
    });

    await file.save();
    res.status(201).json(file);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id })
      .sort('position')
      .select('-path');
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching files' });
  }
};

exports.updateTags = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.tags = req.body.tags;
    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error updating tags' });
  }
};

exports.reorderFile = async (req, res) => {
  try {
    const { newPosition } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const oldPosition = file.position;

    // Update positions of other files
    if (newPosition > oldPosition) {
      await File.updateMany(
        { 
          owner: req.user._id,
          position: { $gt: oldPosition, $lte: newPosition }
        },
        { $inc: { position: -1 } }
      );
    } else {
      await File.updateMany(
        { 
          owner: req.user._id,
          position: { $gte: newPosition, $lt: oldPosition }
        },
        { $inc: { position: 1 } }
      );
    }

    file.position = newPosition;
    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error reordering file' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete physical file
    await fs.unlink(file.path);
    
    // Delete thumbnail if exists
    if (file.thumbnail) {
      const thumbnailPath = path.join(process.env.UPLOAD_DIR, path.basename(file.thumbnail));
      await fs.unlink(thumbnailPath).catch(() => {});
    }

    await file.deleteOne();
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file' });
  }
};

exports.getFileStats = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id })
      .select('stats');
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json(file.stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching file stats' });
  }
};

exports.getSharedFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .select('-path');
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared file' });
  }
};

exports.recordView = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.stats.views += 1;
    file.stats.lastViewed = new Date();
    await file.save();

    res.json({ message: 'View recorded' });
  } catch (error) {
    res.status(500).json({ message: 'Error recording view' });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.stats.downloads += 1;
    await file.save();

    res.download(file.path, file.name);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading file' });
  }
}; 