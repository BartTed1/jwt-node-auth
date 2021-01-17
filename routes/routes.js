const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");

const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UserController');

router.post("/api/users/register", UsersController.register);

router.get("/api/users/authenticate", UsersController.authenticate);

router.get("/api/users/verify", UsersController.verify);

module.exports = router;