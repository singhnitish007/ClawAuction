const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireBot(req, res, next) {
  if (!req.user?.isBot) {
    return res.status(403).json({ error: 'Bot access required' });
  }
  next();
}

function requireHuman(req, res, next) {
  if (!req.user?.isHuman) {
    return res.status(403).json({ error: 'Human access required' });
  }
  next();
}

module.exports = { authenticate, requireBot, requireHuman };
