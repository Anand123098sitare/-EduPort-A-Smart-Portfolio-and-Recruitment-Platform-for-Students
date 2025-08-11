const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Ensure the path to your middleware is correct relative to routes.js
const auth = require('./middleware/auth'); 
const Project = require('./models/Project');
const User = require('./models/User');

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Note: This path assumes your server is run from the 'backend' directory.
    const uploadPath = path.join(__dirname, '../public/uploads/projects');
    // Create the directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to prevent conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});


// --- Project Routes ---

// @route   POST api/projects
// @desc    Create a project
// @access  Private
router.post('/', auth, upload.single('projectImage'), async (req, res) => {
  const { projectName, projectDescription, techUsed, projectUrl, githubUrl } = req.body;

  if (!projectName || !projectDescription || !techUsed) {
    return res.status(400).json({ message: 'Project Name, Description, and Tech Used are required.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Project image is required.' });
  }

  try {
    // The URL path should be relative to the server's public folder for client access
    const imageUrl = `/uploads/projects/${req.file.filename}`;

    const newProject = new Project({
      user: req.user.id,
      projectName,
      projectDescription,
      techUsed,
      projectUrl: projectUrl || '',
      githubUrl: githubUrl || '',
      screenshotUrl: imageUrl
      // Removed userName and userAvatar as they are not in the Project schema.
      // This data should be populated on the frontend via the 'user' ref.
    });

    const project = await newProject.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('Project creation error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/projects/community
// @desc    Get all projects from all users (for community feed)
// @access  Private
router.get('/community', auth, async (req, res) => {
  try {
    // Populate user data to get name and avatar for each project
    const projects = await Project.find({})
      .populate('user', ['name', 'profilePictureUrl'])
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/:id
// @desc    Get a single project by its ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('user', ['name', 'profilePictureUrl']);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Delete the image file from the server
    const imagePath = path.join(__dirname, '../public', project.screenshotUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // FIX: Replaced deprecated .remove() with the modern .deleteOne()
    await Project.deleteOne({ _id: req.params.id });

    res.json({ message: 'Project removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Voting Routes ---

// @route   PUT api/projects/:id/upvote
// @desc    Upvote a project
// @access  Private
router.put('/:id/upvote', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Initialize arrays for legacy projects
    if (!project.upvotedBy) {
      project.upvotedBy = [];
    }
    if (!project.downvotedBy) {
      project.downvotedBy = [];
    }

    if (project.upvotedBy.some(userId => userId.toString() === req.user.id)) {
      project.upvotedBy = project.upvotedBy.filter(
        userId => userId.toString() !== req.user.id
      );
    } else {
      project.upvotedBy.push(req.user.id);
      project.downvotedBy = project.downvotedBy.filter(
        userId => userId.toString() !== req.user.id
      );
    }
    
    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/projects/:id/downvote
// @desc    Downvote a project
// @access  Private
router.put('/:id/downvote', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Initialize arrays for legacy projects
    if (!project.upvotedBy) {
      project.upvotedBy = [];
    }
    if (!project.downvotedBy) {
      project.downvotedBy = [];
    }

    if (project.downvotedBy.some(userId => userId.toString() === req.user.id)) {
      project.downvotedBy = project.downvotedBy.filter(
        userId => userId.toString() !== req.user.id
      );
    } else {
      project.downvotedBy.push(req.user.id);
      project.upvotedBy = project.upvotedBy.filter(
        userId => userId.toString() !== req.user.id
      );
    }
    
    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// --- Comment Routes ---

// @route   POST api/projects/:id/comment
// @desc    Add a comment to a project
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
  const { text } = req.body;
  if (!text) {
      return res.status(400).json({ message: 'Comment text is required.' });
  }

  try {
    const user = await User.findById(req.user.id).select('-password');
    const project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
    }

    const newComment = {
      user: req.user.id,
      text: text,
      name: user.name,
      // FIX: Corrected 'avatar' to 'profilePictureUrl' to match the User model
      avatar: user.profilePictureUrl 
    };

    project.comments.unshift(newComment);
    await project.save();

    res.json(project.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/projects/:id/comment/:comment_id
// @desc    Delete a comment from a project
// @access  Private
router.delete('/:id/comment/:comment_id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        const comment = project.comments.find(
            comment => comment.id === req.params.comment_id
        );

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized.' });
        }

        project.comments = project.comments.filter(
            ({ id }) => id.toString() !== req.params.comment_id
        );

        await project.save();
        res.json(project.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
