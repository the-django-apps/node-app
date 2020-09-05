const express = require('express')
const User = require('../model/users.js')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser');
const auth = require('../setting/auth-middleware')
const { body, validationResult } = require('express-validator');

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
    res.locals.success = req.flash('success')
    res.locals.isAuthenticated = req.isAuthenticated()
    next();
});



router.get('/', (req, res) => {
  res.render('index')
})

router.get('/gallery', (req, res) => {
  res.render('gallery')
})

router.get('/success',auth.checkAuthenticated, (req,res) => {
	res.render('success',{msg:"messagee"})
})

router.get('/signup', auth.checkNotAuthenticated, (req, res) => {
  res.render('signup')
})

router.post('/signup', auth.checkNotAuthenticated, [
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long'),
  body('email').custom(value => {
    return User.findOne({email:value}).then(user => {
      if (user) {
        return Promise.reject('E-mail already in use')
      }
    })
  }),
  body('email').isEmail()

  ] , async (req, res) => {
  
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const alert = errors.array() 
      
      return res.render('signup' , {alert})
    }
      
    const user = new User(req.body)
	  await user.save()		
		req.flash("success_message","Registered Successfully.. Login To Continue")
    res.redirect('/login')
  
})

router.get('/login', auth.checkNotAuthenticated, (req, res) => {
  res.render('login')
})

router.post('/login', auth.checkNotAuthenticated , passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
  successFlash: 'logedin'
}))

router.get('/logout', auth.checkAuthenticated ,(req, res) => {
  req.logOut()
  res.redirect('/')
})


module.exports = router