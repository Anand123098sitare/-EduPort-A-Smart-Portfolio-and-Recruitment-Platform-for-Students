// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  fullName: {
    type: String,
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness for non-null values
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  profilePictureUrl: {
    type: String,
  },
  profileImage: {
    type: String, // File path for uploaded profile image
  },
  resumeUrl: {
    type: String, // File path for uploaded resume
  },
  socialLinks: {
    linkedin: {
      type: String,
    },
    github: {
      type: String,
    },
    portfolio: {
      type: String,
    },
    twitter: {
      type: String,
    },
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('user', UserSchema);