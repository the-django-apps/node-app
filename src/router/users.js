const express = require('express')
const User = require('../model/users')
const Gallery = require('../model/gallery')
const IndoorEvent = require('../model/indoorEvent')
const OutdoorEvent = require('../model/outdoorEvent')
const Registration = require('../model/registration')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser');
const auth = require('../setting/auth-middleware')
const verifyPin = require('../setting/verifyPin')
const multer = require('multer')
const sharp = require('sharp')

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SEND_GRID_KEY)

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
    res.locals.flag = req.flash('flag')
    res.locals.optionFlag = req.flash('optionFlag')
    res.locals.isAuthenticated = req.isAuthenticated()
    next();
});

const requiresAdmin = function() {
  return [
    auth.checkAuthenticated,
    function(req, res, next) {
      
      if (req.user && req.user.isAdmin === true)
        next();
      else
        res.send(401, 'Unauthorized');
    }
  ]
};


/******************************Main Contents***************************************/
router.get('/', (req, res) => {
  res.render('index',{currentUser:req.user})
})

router.get('/event', async (req, res) => {
  const indoorevents = await IndoorEvent.find({})
  const outdoorevents = await OutdoorEvent.find({})
  res.render('event',{indoorevents,outdoorevents,currentUser:req.user})
})

router.get('/about', (req, res) => {
  res.render('about',{currentUser:req.user})
})

router.get('/example', (req, res) => {
  res.render('example',{currentUser:req.user})
})

router.get('/contact', (req, res) => {
  res.render('contact',{currentUser:req.user})
})

router.post('/contact', async (req, res) => {
  const msg = {
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: 'Contact User',
      text: 'Name: ' + req.body.name + '\nEmail: ' + req.body.email + '\nFeedback: ' + req.body.feedback
    }
    await sgMail.send(msg)
  req.flash('success_message', 'Feedback sent sucessfully!')
  res.redirect('/contact')
})

router.get('/gallery', async (req, res) => {
  const gallery = await Gallery.find({})
  res.render('gallery',{gallery,currentUser:req.user})
})
/******************************Login Signup Logout *******************************/
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
   body('email').isEmail().withMessage('Invalid Email')

  ] , async (req, res) => {
  
    try {
      const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const alert = errors.array() 
      
      return res.render('signup' , {alert})
    }
      
    const user = new User(req.body)
    await user.save()   
    const msg = {
      to: req.body.email,
      from: process.env.FROM_EMAIL,
      subject: 'Event Management Sign up',
      text: 'Registration process is sucessfully completed',
      html: '<strong>Registration process is sucessfully completed</strong>',
    }
    await sgMail.send(msg)
    req.flash("success_message","Registered Successfully.. Login To Continue")
    res.redirect('/login')
  } catch(e) {

    if(e.toString().includes('required')) {
      req.flash("error_message",'All Fields are required')
      res.redirect('/signup')
    } else {
      req.flash("error_message",'Somthing went wrong. Please try again!')
      res.redirect('/signup')
    }
    
  }
    
  
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

/********************************** Forgot Password *****************************************/

router.get('/user/forgotPassword' ,(req, res) => {
  res.render('forgotPassword',{sendOption:'email'})
})

router.post('/user/forgotPassword' , verifyPin.sendPin , (req, res) => {

  res.render('forgotPassword',{sendOption:'pin'})
})

router.post('/user/forgotPassword/verifyPin' , verifyPin.verifyPin , (req, res) => {

  res.render('forgotPassword',{sendOption:'setPassword'})
})

router.post('/user/forgotPassword/setPassword' , [
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long'),
  ] ,verifyPin.setPassword , (req, res) => {
  req.flash('error_message', 'Password sucessfully Changed!')
  res.redirect('/login')
})

/************************************* Register Event **************************************/

router.get('/event/register/:id', async (req,res) => {

  try {
  const indoorEvent = await IndoorEvent.findById(req.params.id)
  const outdoorEvent = await OutdoorEvent.findById(req.params.id)


  if(indoorEvent) {
    var registerEvent = new Registration({
      registeredEvent:indoorEvent.indoorEvent,
      eventDescription:indoorEvent.description,
      owner:req.user._id
    })
  }else if(outdoorEvent) {
    var registerEvent = new Registration({
      registeredEvent:outdoorEvent.outdoorEvent,
      eventDescription:outdoorEvent.description,
      owner:req.user._id
    })
  }

  const msg = {
      to: req.user.email,
      from: process.env.FROM_EMAIL,
      subject: 'Event Registration',
      text: 'You have sucessfully registered in ' + registerEvent.registeredEvent+ ' event'
    }
    await sgMail.send(msg)

  await registerEvent.save()

  res.redirect('/event')
  } catch(e) {
    console.log(e)
    req.flash('error_message', "Somthing thing went wrong. Please try again!")
    res.redirect('/event')
  }
  

})

router.get('/myaccount/registeredEvents', async (req,res) => {

  await req.user.populate({
    path: 'registration'
  }).execPopulate()

  res.render('account',({registeredEvents:req.user.registration,currentUser:req.user}))
  

})

router.get('/myaccount/registeredEvents/delete/:id' , async (req,res) => {

  await Registration.findByIdAndDelete(req.params.id)
  res.redirect('/myaccount/registeredEvents')
})





module.exports = router