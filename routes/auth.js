const express = require('express');
const router = express.Router();
const config = require('config');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// IMPORTING USER MODAL
const User = require('../modals/User');

// @route   GET api/auth
// @desc    Get logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('SERVER ERROR!!');
  }
});

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/',
  [
    check('email', 'Please enter valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    // Verify field values
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Authenticating user
    const { email, password } = req.body;

    // Check if email exists
    try {
      let user = await User.findOne({ email: email });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
      // Matching the password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // Generate Token
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send('User save failed!');
    }
  }
);

module.exports = router;
