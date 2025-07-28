const jwt = require('jsonwebtoken');

// This is the single source of truth for our JWT secret.
// It must be identical to the one in server.js.
const JWT_SECRET = 'a_super_secret_jwt_key_that_is_long_and_random';

module.exports = function(req, res, next) {
  // Get token from the request header, typically named 'x-auth-token'
  const token = req.header('x-auth-token');

  // Check if no token is present in the header
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify the token
  try {
    // We use the same shared secret to decode the token. If this secret
    // does not match the one used to sign the token in server.js, this will fail.
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach the user's ID from the token payload to the request object
    // so our protected routes can access it.
    req.user = decoded.user;
    
    // Pass control to the next function in the middleware chain (the route handler)
    next();
  } catch (err) {
    // If jwt.verify fails (e.g., invalid signature, expired token), send an error
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
