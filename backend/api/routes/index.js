const express = require('express');
const User = require('./User');
const router = express.Router();

router.use('/user', User);

module.exports = router;