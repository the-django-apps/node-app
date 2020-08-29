const express = require('express')
const User = require('../model/users.js')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser');
const auth = require('../setting/auth-middleware')

const initializePassport = require('../setting/passport-config')
initializePassport(passport)

const router = new express.Router()



router.use(cookieParser());
router.use(session({
  secret: process.env.COOKIE_SECRET_USER,
  maxAge: 3600000,
  resave: true,
  saveUninitialized: true
}))
router.use(passport.initialize())
router.use(passport.session())
router.use(flash())
router.use(function (req, res, next) {
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.error = req.flash('error');
    next();
});



router.get('/', auth.checkAuthenticated, (req, res) => {
  res.render('index', { name: req.user.name })
})

router.get('/success',auth.checkAuthenticated, (req,res) => {
	res.render('success')
})

router.get('/signup', auth.checkNotAuthenticated, (req, res) => {
  res.render('signup')
})

router.post('/signup', auth.checkNotAuthenticated, async (req, res) => {
  try {
    
    const user = new User(req.body)
	await user.save()		
		
    res.redirect('/login')
  } catch {
    res.redirect('/signup')
  }
})

router.get('/login', auth.checkNotAuthenticated, (req, res) => {
  res.render('login')
})

router.post('/login', auth.checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

router.get('/logout', auth.checkAuthenticated ,(req, res) => {
  req.logOut()
  res.redirect('/login')
})


module.exports = router