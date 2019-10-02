const express = require('express');
const router = express.Router();
const config = require('config');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// IMPORTING USER MODAL
const User = require('../modals/User');

// @route   POST api/users
// @desc    Regiter a user
// @access  Public
router.post(
  '/',
  // Fields validation configuration
  [
    check('name', 'Please enter name')
      .not()
      .isEmpty(),
    check('email', 'Please enter valid email').isEmail(),
    check(
      'password',
      'Please enter password with 6 or morecharacters'
    ).isLength({ min: 6 })
  ],

  async (req, res) => {
    // Verify field values
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Saving user
    const { name, email, password } = req.body;

    try {
      // Check if email address exists
      let user = await User.findOne({ email: email });

      if (user) {
        return res.status(400).json({ msg: 'Email already exists' });
      }

      // Instatiate new user modal
      user = new User({
        name,
        email,
        password
      });

      // Encrypting password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user
      await user.save();

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
      res.status(500).send('SERVER ERROR!!');
    }
  }
);

module.exports = router;
