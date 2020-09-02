const express = require('express');
const auth = require('../../middlewares/auth')
const UserController = require('../controller/User')
const route = express.Router();

route.get('/all', auth, UserController.getAllUser);

route.post('/newuser', UserController.createNewUser);

route.get('/byid/:email', auth, UserController.getUserByEmail);

route.put('/update', auth, UserController.updateUser);

route.post('/login', UserController.loginUser);

route.delete('/delete/:email', auth, UserController.deleteUser)

module.exports = route;