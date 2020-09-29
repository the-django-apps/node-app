const express = require('express')
const User = require('../model/users')
const Gallery = require('../model/gallery')
const IndoorEvent = require('../model/indoorEvent')
const OutdoorEvent = require('../model/outdoorEvent')
const Registration = require('../model/registration')
const EventRegistration = require('../model/eventRegistration')
const Contact = require('../model/contactUs')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser');
const auth = require('../setting/auth-middleware')
const verifyPin = require('../setting/verifyPin')


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
    res.locals.alert_msg = req.flash('alert_msg')
    res.locals.isAuthenticated = req.isAuthenticated()
    res.locals.discount = req.flash('discount')
    next();
});


/******************************Main Contents***************************************/
router.get('/', (req, res) => {
  res.render('index',{currentUser:req.user})
})

router.get('/event', async (req, res) => {
  const indoorevents = await IndoorEvent.find({})
  const outdoorevents = await OutdoorEvent.find({})
  res.render('event',{indoorevents,outdoorevents,currentUser:req.user,discount: discount})
})

router.get('/about', (req, res) => {
  res.render('about',{currentUser:req.user})
})

router.get('/contact', (req, res) => {
  res.render('contact',{currentUser:req.user})
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
   body('email').isEmail().withMessage('Invalid Email'),
   body('mobileNumber').custom(value => {
     if(isNaN(value)) {
      throw new Error('Mobile number is not a number')
     }else if(value.length != 10) {
      throw new Error('Mobile number must be 10 digit')
     } else {
       return true
     }
   })

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

router.get('/logout', (req, res) => {
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

router.post('/event/register', async (req,res) => {

  try {
      var eventsToEmail = []
      if(Object.keys(req.body).length === 1 || (discount === false && Object.keys(req.body).length > 0)) {
        
        for(var event in req.body) {
        var indoorEvent = await IndoorEvent.findById(event)
        var outdoorEvent = await OutdoorEvent.findById(event)
        if(indoorEvent) {
            var registerEvent = new Registration({
              registeredEvent:indoorEvent.indoorEvent,
              price:indoorEvent.price,
              discountGain: indoorEvent.discountValue,
              eventDescription:indoorEvent.description,
              owner:req.user._id
            })
            
            var registerUser = new EventRegistration({
              user:req.user.name,
              email:req.user.email,
              price:indoorEvent.price,
              discountGain: indoorEvent.discountValue,
              eventDescription:indoorEvent.description,
              syncRegistrationId:registerEvent._id,
              indoorEventId:indoorEvent._id
            })
            registerEvent.syncEventRegistrationId = registerUser._id
            eventsToEmail.push(indoorEvent)
          }else if(outdoorEvent) {
            var registerEvent = new Registration({
              registeredEvent:outdoorEvent.outdoorEvent,
              price:outdoorEvent.price,
              discountGain: outdoorEvent.discountValue,
              eventDescription:outdoorEvent.description,
              owner:req.user._id
            })
            var registerUser = new EventRegistration({
              user:req.user.name,
              price:outdoorEvent.price,
              email:req.user.email,
              discountGain: outdoorEvent.discountValue,
              eventDescription:outdoorEvent.description,
              syncRegistrationId:registerEvent._id,
              outdoorEventId:outdoorEvent._id
            })
            registerEvent.syncEventRegistrationId = registerUser._id
            eventsToEmail.push(outdoorEvent)
          }
          await registerEvent.save()
          await registerUser.save()
          
        }
        
        req.flash('error_message', "Registered successfully")
      }else if(Object.keys(req.body).length > 1 && discount === true) {
        for(var event in req.body) {
        var indoorEvent = await IndoorEvent.findById(event)
        var outdoorEvent = await OutdoorEvent.findById(event)
        if(indoorEvent) {
            var discountGot = (indoorEvent.price * indoorEvent.discountValue)/100
            indoorEvent.price -= discountGot
            var registerEvent = new Registration({
              registeredEvent:indoorEvent.indoorEvent,
              price:indoorEvent.price,
              discountFlag: true,
              discountGain: indoorEvent.discountValue,
              eventDescription:indoorEvent.description,
              owner:req.user._id
            })
            var registerUser = new EventRegistration({
              user:req.user.name,
              price:indoorEvent.price,
              email:req.user.email,
              discountFlag: true,
              discountGain: indoorEvent.discountValue,
              eventDescription:indoorEvent.description,
              syncRegistrationId:registerEvent._id,
              indoorEventId:indoorEvent._id
            })
            registerEvent.syncEventRegistrationId = registerUser._id
            eventsToEmail.push(indoorEvent)
          }else if(outdoorEvent) {
            var discountGot = (outdoorEvent.price * outdoorEvent.discountValue)/100
            outdoorEvent.price -= discountGot
            var registerEvent = new Registration({
              registeredEvent:outdoorEvent.outdoorEvent,
              price:outdoorEvent.price,
              discountFlag: true,
              discountGain: outdoorEvent.discountValue,
              eventDescription:outdoorEvent.description,
              owner:req.user._id
            })
            var registerUser = new EventRegistration({
              user:req.user.name,
              price:outdoorEvent.price,
              email:req.user.email,
              discountFlag: true,
              discountGain: outdoorEvent.discountValue,
              eventDescription:outdoorEvent.description,
              syncRegistrationId:registerEvent._id,
              outdoorEventId:outdoorEvent._id
            })
            registerEvent.syncEventRegistrationId = registerUser._id
            eventsToEmail.push(outdoorEvent)
          }
          await registerEvent.save()
          await registerUser.save()
        }
        
        req.flash('error_message', "Registered successfully")
      }
      
      var eventsString = '';
      eventsToEmail.forEach((value) => {
        if(value.indoorEvent){
          eventsString += value.indoorEvent + ','
        } else {
          eventsString += value.outdoorEvent + ','
        }
        
      })
      

      
  const msg = {
      to: req.user.email,
      from: process.env.FROM_EMAIL,
      subject: 'Event Registration',
      text: 'You have sucessfully registered in: \n' + eventsString + ' event'
    }
    await sgMail.send(msg)

  
  
  res.redirect('/event')
  } catch(e) {
    req.flash('error_message', "Somthing thing went wrong. Please try again!")
    res.redirect('/event')
  }
})

/********************************** My Account ************************************/

router.get('/myaccount', async (req,res) => {

  if(req.query.accountOption === 'registeredEvents' ) {
      await req.user.populate({
      path: 'registration'
    }).execPopulate()
    var eventsTotal = 0
    req.user.registration.forEach((value) => {
      eventsTotal += value.price
    })

  res.render('account',({registeredEvents:req.user.registration,eventsTotal,currentUser:req.user,accountOption:'registeredEvents'}))
  } else if (req.query.accountOption === 'resetPassword') {
    res.render('account',{currentUser:req.user,accountOption:'resetPassword'})
  } else {
    console.log('error')
  }
  

})

router.get('/myaccount/registeredEvents/delete/:id' , async (req,res) => {

  await Registration.findByIdAndDelete(req.params.id)
  await EventRegistration.findOneAndDelete({syncRegistrationId:req.params.id})
  res.redirect('/myaccount?accountOption=registeredEvents')
})


// Reset password
router.post('/user/resetPassword',async (req,res) => {
  if (await bcrypt.compare(req.body.oldPassword, req.user.password)) {
    req.user.password = req.body.password
    await req.user.save()
    res.redirect('/myaccount?accountOption=resetPassword')
  }else {
    req.flash('error_message','Old password is wrong')
    res.redirect('/myaccount?accountOption=resetPassword')
  }
})


module.exports = router