// =================================================================
// 1. IMPORT ALL NECESSARY PACKAGES
// =================================================================
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const connectDB = require('./db');
const User = require('./models/User');
const auth = require('./middleware/auth'); // Import the auth middleware

// This is the single source of truth for the JWT secret.
// It must be identical to the one in middleware/auth.js.
const JWT_SECRET = 'a_super_secret_jwt_key_that_is_long_and_random';

// =================================================================
// 2. INITIALIZE APP & CONNECT TO DATABASE
// =================================================================
const app = express();
const port = 3000;

connectDB();
require('dotenv').config();
// =================================================================
// 3. SETUP MIDDLEWARE
// =================================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  secret: 'a_very_secret_key_for_eduport_session', // This is for sessions, not JWT
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// =================================================================
// 4. CONFIGURE PASSPORT STRATEGIES
// =================================================================
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
     clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Replace with your actual Client Secret
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    const { displayName, emails, photos } = profile;
    const email = emails[0].value;
    const profilePictureUrl = photos[0].value;
    try {
        let user = await User.findOne({ email: email });
        if (user) {
            user.name = displayName;
            user.profilePictureUrl = profilePictureUrl;
            await user.save();
            return done(null, user);
        }
        const randomPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);
        user = new User({
            name: displayName,
            email: email,
            profilePictureUrl: profilePictureUrl,
            password: hashedPassword,
        });
        await user.save();
        done(null, user);
    } catch (err) {
        console.error(err);
        return done(err, null);
    }
  }
));

// =================================================================
// 5. DEFINE API ROUTES
// =================================================================
app.use('/api/projects', require('./routes'));

// --- AUTHENTICATION ROUTES ---
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already exists.' });
    user = new User({ email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials.' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });
        
        const payload = { user: { id: user.id } };
        // Use the shared secret to create the token
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// --- GET CURRENT USER'S DETAILS ---
app.get('/api/users/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- GOOGLE AUTH ROUTES ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login.html', session: false }),
  (req, res) => {
    const payload = { user: { id: req.user.id } };
    // Use the same shared secret to create the token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`/dashboard.html?token=${token}`);
  });

// =================================================================
// 6. START THE SERVER
// =================================================================
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
