const express = require('express');
const router = express.Router();
const { processPayment } = require('./payment.controller');

// Mock protectRoute middleware from Member D (Auth Slice)
const protectRoute = (req, res, next) => {
  if (req.headers.authorization) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

router.post('/process', protectRoute, processPayment);

module.exports = router;
