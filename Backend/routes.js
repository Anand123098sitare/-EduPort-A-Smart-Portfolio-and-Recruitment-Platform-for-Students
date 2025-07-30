const express = require('express');
const router = express.Router();
const auth = require('./middleware/auth'); 
const Project = require('./models/Project');
const User = require('./models/User');

// @route   POST api/projects
// @desc    Create a project
// @access  Private
router.post('/', auth, async (req, res) => {
  // UPDATED: Now accepts 'category' from the request body
  const { title, description, category } = req.body;

  try {
    const newProject = new Project({
      title,
      description,
      category: category || 'General', // Set a default category if none is provided
      user: req.user.id
    });

    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

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

// @route   PUT api/projects/upvote/:id
// @desc    Upvote a project
// @access  Private
router.put('/upvote/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Increment the upvote count
        project.upvotes++;

        await project.save();
        res.json(project.upvotes); // Send back the new total number of upvotes
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
