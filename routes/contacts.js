const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Contact = require('../modals/Contact');
const { check, validationResult } = require('express-validator');
const User = require('../modals/User');

// @route   GET api/contacts
// @desc    Get all users contact
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user.id }).sort({
      date: -1
    });
    console.log(contacts);
    return res.status(200).json(contacts);
  } catch (err) {
    res.status(500).send('SERVER ERROR!!');
  }
});

// @route   POST api/contacts
// @desc    Add new contact
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Please enter name')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    // Verify field values
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, phone, type } = req.body;
    try {
      const newContact = new Contact({
        name,
        email,
        phone,
        type,
        user: req.user.id
      });

      const contact = await newContact.save();
      res.json(contact);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('SERVER ERROR!!');
    }
  }
);

// @route   PUT api/contacts/:id
// @desc    Update contact
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, email, phone, type } = req.body;

  // BUILD CONTACT OBJECT
  const contactFields = {};
  if (name) contactFields.name = name;
  if (email) contactFields.email = email;
  if (phone) contactFields.phone = phone;
  if (type) contactFields.type = type;

  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) return res.status(404).json({ msg: 'Contact not found' });

    // Make sure user owns the contact
    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not Authorized!!' });
    }

    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: contactFields },
      { new: true }
    );
    console.log('update called', contactFields);

    res.json(contact);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('SERVER ERROR!!');
  }
});

// @route   DELETE api/contacts/:id
// @desc    Delete contact
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) return res.status(404).json({ msg: 'Contact not found' });

    // Make sure user owns the contact
    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not Authorized!!' });
    }

    await Contact.findByIdAndRemove(req.params.id);

    console.log('Delete contact called, ID:', req.params.id);

    res.json('Contact removed');
  } catch (err) {
    console.log(err.message);
    res.status(500).send('SERVER ERROR!!');
  }
});

module.exports = router;
