const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('./middleware/auth'); 
const Project = require('./models/Project');
const User = require('./models/User');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/projects');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// @route   POST api/projects
// @desc    Create a project with enhanced fields and image upload
// @access  Private
router.post('/', auth, upload.single('projectImage'), async (req, res) => {
  const { 
    projectName, 
    projectDescription, 
    techUsed, 
    projectUrl, 
    githubUrl, 
    screenshotUrl,
    // Legacy support
    title,
    description,
    category 
  } = req.body;

  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        message: 'Project image is required. Please upload an image file.' 
      });
    }

    if (projectName && projectDescription && techUsed) {
      // Generate image URL for the uploaded file
      const imageUrl = `/uploads/projects/${req.file.filename}`;
      
      const newProject = new Project({
        projectName,
        projectDescription,
        techUsed,
        projectUrl: projectUrl || '',
        githubUrl: githubUrl || '',
        screenshotUrl: imageUrl, // Use uploaded image as screenshot
        title: projectName,
        description: projectDescription,
        category: getTechDisplayName(techUsed),
        user: req.user.id
      });

      const project = await newProject.save();
      await project.populate('user', 'name email');
      res.json(project);
    } else if (title && description) {
      // Legacy format support
      const newProject = new Project({
        title,
        description,
        category: category || 'General',
        // Map to new fields for consistency
        projectName: title,
        projectDescription: description,
        techUsed: 'other',
        projectUrl: '',
        user: req.user.id
      });

      const project = await newProject.save();
      res.json(project);
    } else {
      return res.status(400).json({ 
        message: 'Missing required fields. Please provide projectName, projectDescription, techUsed, and projectUrl.' 
      });
    }
  } catch (err) {
    console.error('Project creation error:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ') 
      });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// Helper function to convert tech codes to display names
function getTechDisplayName(techCode) {
  const techMap = {
    'web-development': 'Web Development',
    'android-development': 'Android Development',
    'ios-development': 'iOS Development',
    'ai-ml': 'AI/ML',
    'data-science': 'Data Science',
    'blockchain': 'Blockchain',
    'game-development': 'Game Development',
    'desktop-app': 'Desktop Application',
    'devops': 'DevOps',
    'cybersecurity': 'Cybersecurity',
    'iot': 'IoT',
    'other': 'Other'
  };
  return techMap[techCode] || 'General';
}

// @route   GET api/projects
// @desc    Get all projects for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/community
// @desc    Get all community projects (from all users)
// @access  Private
router.get('/community', auth, async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/projects/:id/upvote
// @desc    Upvote a project (enhanced with duplicate prevention)
// @access  Private
router.post('/:id/upvote', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user has already upvoted this project
        if (project.upvotedBy.includes(req.user.id)) {
            return res.status(400).json({ message: 'You have already upvoted this project' });
        }

        // Add user to upvotedBy array and increment upvotes
        project.upvotedBy.push(req.user.id);
        project.upvotes = project.upvotedBy.length;

        await project.save();
        
        // Return the updated project with user info
        await project.populate('user', 'name email');
        
        res.json(project);
    } catch (err) {
        console.error('Upvote error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET api/projects/all
// @desc    Get all projects for teachers (community view)
// @access  Private
router.get('/all', auth, async (req, res) => {
    try {
        const projects = await Project.find({})
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});


module.exports = router;
