// backend/models/Project.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  projectName: {
    type: String,
    required: true
  },
  projectDescription: {
    type: String,
    required: true
  },
  techUsed: {
    type: String,
    required: true,
    enum: [
      'web-development',
      'android-development', 
      'ios-development',
      'ai-ml',
      'data-science',
      'blockchain',
      'game-development',
      'desktop-app',
      'devops',
      'cybersecurity',
      'iot',
      'other'
    ]
  },
  projectUrl: {
    type: String,
    required: true
  },
  githubUrl: {
    type: String,
    required: false
  },
  screenshotUrl: {
    type: String,
    required: false
  },
  // Legacy fields for backward compatibility
  title: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  category: {
    type: String,
    default: 'General'
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('project', ProjectSchema);