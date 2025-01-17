const express = require('express')
const User = require('../model/users')
const Gallery = require('../model/gallery')
const IndoorEvent = require('../model/indoorEvent')
const OutdoorEvent = require('../model/outdoorEvent')
const Registration = require('../model/registration')
const EventRegistration = require('../model/eventRegistration')
const RandomisedUsers = require('../model/randomisedUserList')
const Contact = require('../model/contactUs')
const DateEvent = require('../model/dateEvents')
const Notice = require('../model/notice')
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
const dateEvent = require('../model/dateEvents')
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
  res.render('index', { currentUser: req.user })
})

router.get('/eventRegistration', auth.checkAuthenticated, async (req, res) => {
  if (req.query.eventFlag == 'eventRegistration') {
    const indoorevents = await IndoorEvent.find({})
    const outdoorevents = await OutdoorEvent.find({})

    return res.render('event', { indoorevents, outdoorevents, currentUser: req.user, discount, eventFlag: 'eventRegistration' })
  }

  res.redirect('/404')
})

router.get('/eventDashboard', async (req, res) => {

  if (req.query.eventFlag == 'eventDashboard') {
    const dateEvents = await DateEvent.find({})
    const EventDates = []
   
    var randomisedList = await randomisedUser()

    for (var x = 1; x < dateEvents.length; x++) {
      var temp = x
      for (var y = x - 1; y >= 0; y--) {
        if (dateEvents[x].date < dateEvents[y].date) {
          temp = y

        }
      }
      dateEvents.splice(temp, 0, dateEvents[x])
      dateEvents.splice(x + 1, 1)
    }

    for (var i = 0; i < dateEvents.length; i++) {
      await dateEvents[i].populate({
        path: 'indoorEventDate'
      }).execPopulate()
      await dateEvents[i].populate({
        path: 'outdoorEventDate'
      }).execPopulate()

      if (dateEvents[i].indoorEventDate.length !== 0 && dateEvents[i].outdoorEventDate.length !== 0) {
        let eventArray = []
        let eventObject = []
        dateEvents[i].outdoorEventDate.forEach(value => {
          eventArray.push([value.outdoorEvent])
        })
        dateEvents[i].indoorEventDate.forEach(value => {
          eventArray.push([value.indoorEvent])
        })
        eventArray.push(dateEvents[i].date.toDateString())
        EventDates.push(eventArray)
      } else if (dateEvents[i].indoorEventDate.length !== 0) {
        let eventObject = []
        let eventArray = []
        dateEvents[i].indoorEventDate.forEach(value => {
          eventArray.push([value.indoorEvent])
        })
        eventArray[eventArray.length] = dateEvents[i].date.toDateString()
        EventDates.push(eventArray)
      } else if (dateEvents[i].outdoorEventDate.length !== 0) {
        let eventArray = []
        let eventObject = []
        dateEvents[i].outdoorEventDate.forEach(value => {
          eventArray.push([value.outdoorEvent])
        })
        eventArray[eventArray.length] = dateEvents[i].date.toDateString()
        EventDates.push(eventArray)
      }
    }
    
   for(let i = 0; i < EventDates.length ; i++){
    for(let j = 0; j < EventDates[i].length -1  ; j++) {
      for(let k =0; k < EventDates[i][j].length ; k++) {
        for(let x=0; x  <  randomisedList.length; x++) {
              if(randomisedList[x][0]){
                if(randomisedList[x][0].indoorEvent == EventDates[i][j][k]){
                  EventDates[i][j].push(randomisedList[x])
                }else if(randomisedList[x][0].outdoorEvent == EventDates[i][j][k]){
                  EventDates[i][j].push(randomisedList[x])
                }
            }
        }
        
      }
    }
   }
  // 
  /********* value of EventDates 
   * [
        [
          [ 'cricket', [Array] ],
          [ 'table tennis', [Array] ],
          'Wed Feb 12 2020'
        ],
        [ [ 'carrom', [Array] ], 'Fri Feb 21 2020' ],
        [ [ 'pubg', [Array] ], 'Sat Jun 20 2020' ]
      ]
   */
     
    
    return res.render('event', { EventDates, currentUser: req.user, eventFlag: 'eventDashboard' })
  }

  res.redirect('/404')
})

/************************************This function is used to add randomised user to database **********************************/

async function randomisedUser() {
  const indoorEvents = await IndoorEvent.find({})
  const outdoorEvents = await OutdoorEvent.find({})
  const randomisedUserList = await RandomisedUsers.find({})
  var ramdomisiedUsersArray = []

  // Below for loop is used to add randomised user in indoor event
  for (var i = 0; i < indoorEvents.length; i++) {
    await indoorEvents[i].populate({
      path: 'indoorEventPath'
    }).execPopulate()

    let randomisedUserFlag 
    
    randomisedUserList.forEach(value => {
      if (value.event === indoorEvents[i].indoorEvent) {
        randomisedUserFlag = value
      }
    })


    if (randomisedUserFlag) {
      var ramdomisiedUsersInner = randomisation(indoorEvents[i],'indoor')

      if (randomisedUserFlag.randomisedUserList.length != ramdomisiedUsersInner.length) {
        await RandomisedUsers.findByIdAndUpdate(randomisedUserFlag._id, { randomisedUserList: ramdomisiedUsersInner })
      }

    } else {
      var ramdomisiedUsersInner = randomisation(indoorEvents[i],'indoor')
      const newRandomisedUserList = new RandomisedUsers({ randomisedUserList: ramdomisiedUsersInner, event: indoorEvents[i].indoorEvent })
      await newRandomisedUserList.save()
    }

  }

  // Below for loop is used to add randomised user in outdoor event
  for (var i = 0; i < outdoorEvents.length; i++) {
    await outdoorEvents[i].populate({
      path: 'outdoorEventPath'
    }).execPopulate()

    let randomisedUserFlag 

   
    randomisedUserList.forEach(value => {
      if (value.event === outdoorEvents[i].outdoorEvent) {
        randomisedUserFlag = value
      }
    })

   

    if (randomisedUserFlag) {
      var ramdomisiedUsersInner = randomisation(outdoorEvents[i],'outdoor')

      if (randomisedUserFlag.randomisedUserList.length != ramdomisiedUsersInner.length) {
        await RandomisedUsers.findByIdAndUpdate(randomisedUserFlag._id, { randomisedUserList: ramdomisiedUsersInner })
      }

    } else {
      var ramdomisiedUsersInner = randomisation(outdoorEvents[i],'outdoor')
      const newRandomisedUserList = new RandomisedUsers({ randomisedUserList: ramdomisiedUsersInner, event: outdoorEvents[i].outdoorEvent })
      await newRandomisedUserList.save()
    }

  }


  const updatedRandomisedUserList = await RandomisedUsers.find({})
  for (var j = 0; j < updatedRandomisedUserList.length; j++) {
    var dataOfAllrandomisedUser = []
    
    for (var k = 0; k < updatedRandomisedUserList[j].randomisedUserList.length; k++) {
      dataOfAllrandomisedUser.push(await EventRegistration.findById(updatedRandomisedUserList[j].randomisedUserList[k]))
    }
    
    ramdomisiedUsersArray.push(dataOfAllrandomisedUser)
  }

 
  return ramdomisiedUsersArray
}

/********************************** This function is used to randomise users  ****************************/

function randomisation(Events,eventType) {
  var filteredArray = []
  if(eventType == 'indoor'){
    filteredArray = Events.indoorEventPath.filter(value => {
      return value.userInEventFlag === true
    })
  }
  if(eventType == 'outdoor'){
    filteredArray = Events.outdoorEventPath.filter(value => {
      return value.userInEventFlag === true
    })
    // console.log()
  }

  var totalUsers = []
  var ramdomisiedUsersInner = []
  while (totalUsers.length < filteredArray.length) {
    var randomUser = Math.floor(Math.random() * filteredArray.length)

    if (!totalUsers.includes(randomUser)) {
      totalUsers.push(randomUser)
      ramdomisiedUsersInner.push(filteredArray[randomUser])
    }

  }
  return ramdomisiedUsersInner
}

/***************************************************************************************************/

router.get('/eventNotice', async (req, res) => {
  if (req.query.eventFlag == 'notice') {
    const notices = await Notice.find({})

    return res.render('event', { notices, currentUser: req.user, eventFlag: 'notice' })
  }

  res.redirect('/404')
})




router.get('/about', (req, res) => {
  res.render('about', { currentUser: req.user })
})

router.get('/notice', (req, res) => {
  res.render('notice', { currentUser: req.user })
})


router.get('/contact', (req, res) => {
  res.render('contact', { currentUser: req.user })
})


router.post('/contact', [
  body('email').isEmail().withMessage('Invalid Email'),
  body('mobileNumber').custom(value => {
    if (isNaN(value)) {
      throw new Error('Mobile number is not a number')
    } else if (value.length != 10) {
      throw new Error('Mobile number must be 10 digit')
    } else {
      return true
    }
  }),
  body('feedback').custom(value => {
    if (value.length > 500) {
      throw new Error('Please keep feedback with 500 characters only')
    } else {
      return true
    }
  })
], async (req, res) => {
  try {
    req.body.name = req.body.name.replace("<", "&lt");
    req.body.name = req.body.name.replace(">", "&gt");
    req.body.name = req.body.name.replace('"', "&quot");
    req.body.name = req.body.name.replace("'", "&apos");
    req.body.name = req.body.name.replace("(", "&#40");
    req.body.name = req.body.name.replace(")", "&#41");
    req.body.name = req.body.name.replace("!", "&#33");
    req.body.name = req.body.name.replace(":", "&#58");
    req.body.name = req.body.name.replace(";", "&#59");
    req.body.name = req.body.name.replace("=", "&#61");
    req.body.name = req.body.name.replace("?", "&#63");
    req.body.name = req.body.name.replace("/", "&#47");
    req.body.name = req.body.name.replace("{", "&#123");
    req.body.name = req.body.name.replace("}", "&#125");
    req.body.name = req.body.name.replace("`", "&#96");

    req.body.feedback = req.body.feedback.replace("<", "&lt");
    req.body.feedback = req.body.feedback.replace(">", "&gt");
    req.body.feedback = req.body.feedback.replace('"', "&quot");
    req.body.feedback = req.body.feedback.replace("'", "&apos");
    req.body.feedback = req.body.feedback.replace("(", "&#40");
    req.body.feedback = req.body.feedback.replace(")", "&#41");
    req.body.feedback = req.body.feedback.replace("!", "&#33");
    req.body.feedback = req.body.feedback.replace(":", "&#58");
    req.body.feedback = req.body.feedback.replace(";", "&#59");
    req.body.feedback = req.body.feedback.replace("=", "&#61");
    req.body.feedback = req.body.feedback.replace("?", "&#63");
    req.body.feedback = req.body.feedback.replace("/", "&#47");
    req.body.feedback = req.body.feedback.replace("{", "&#123");
    req.body.feedback = req.body.feedback.replace("}", "&#125");
    req.body.feedback = req.body.feedback.replace("`", "&#96");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array()
      return res.render('contact', { alert })
    }

    const msg = {
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: 'Contact User',
      text: 'Name: ' + req.body.name + '\nEmail: ' + req.body.email + '\nMobile Number: ' + req.body.mobileNumber + '\nFeedback: ' + req.body.feedback
    }

    const contact = new Contact(req.body)
    contact.save()
    await sgMail.send(msg)
    req.flash('success_message', 'Feedback sent sucessfully!')
    res.redirect('/contact')
  } catch (e) {
    req.flash('success_message', 'Something went wrong. Please try again')
    res.redirect('/contact')
  }

})

router.get('/gallery', async (req, res) => {
  const gallery = await Gallery.find({})
  res.render('gallery', { gallery, currentUser: req.user })
})
/******************************Login Signup Logout *******************************/
router.get('/signup', auth.checkNotAuthenticated, (req, res) => {
  res.render('signup')
})

router.post('/signup', auth.checkNotAuthenticated, [
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long'),
  body('email').custom(value => {
    return User.findOne({ email: value }).then(user => {
      if (user) {
        return Promise.reject('E-mail already in use')
      }
    })
  }),
  body('email').isEmail().withMessage('Invalid Email'),
  body('mobileNumber').custom(value => {
    if (isNaN(value)) {
      throw new Error('Mobile number is not a number')
    } else if (value.length != 10) {
      throw new Error('Mobile number must be 10 digit')
    } else {
      return true
    }
  })

], async (req, res) => {

  try {
    req.body.name = req.body.name.replace("<", "&lt");
    req.body.name = req.body.name.replace(">", "&gt");
    req.body.name = req.body.name.replace('"', "&quot");
    req.body.name = req.body.name.replace("'", "&apos");
    req.body.name = req.body.name.replace("(", "&#40");
    req.body.name = req.body.name.replace(")", "&#41");
    req.body.name = req.body.name.replace("!", "&#33");
    req.body.name = req.body.name.replace(":", "&#58");
    req.body.name = req.body.name.replace(";", "&#59");
    req.body.name = req.body.name.replace("=", "&#61");
    req.body.name = req.body.name.replace("?", "&#63");
    req.body.name = req.body.name.replace("/", "&#47");
    req.body.name = req.body.name.replace("{", "&#123");
    req.body.name = req.body.name.replace("}", "&#125");
    req.body.name = req.body.name.replace("`", "&#96");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array()
      return res.render('signup', { alert })
    }

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      mobileNumber: req.body.mobileNumber
    })
    await user.save()
    const msg = {
      to: req.body.email,
      from: process.env.FROM_EMAIL,
      subject: 'Event Management Sign up',
      text: 'Registration process is sucessfully completed',
      html: '<strong>Registration process is sucessfully completed</strong>',
    }
    await sgMail.send(msg)
    req.flash("success_message", "Registered Successfully.. Login To Continue")
    res.redirect('/login')
  } catch (e) {

    if (e.toString().includes('required')) {
      req.flash("error_message", 'All Fields are required')
      res.redirect('/signup')
    } else {
      req.flash("error_message", 'Somthing went wrong. Please try again!')
      res.redirect('/signup')
    }

  }


})

router.get('/login', auth.checkNotAuthenticated, (req, res) => {
  res.render('login')
})

router.post('/login', auth.checkNotAuthenticated, passport.authenticate('local', {
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

router.get('/user/forgotPassword', (req, res) => {
  res.render('forgotPassword', { sendOption: 'email' })
})

router.post('/user/forgotPassword', verifyPin.sendPin, (req, res) => {

  res.render('forgotPassword', { sendOption: 'pin' })
})

router.post('/user/forgotPassword/verifyPin', verifyPin.verifyPin, (req, res) => {

  res.render('forgotPassword', { sendOption: 'setPassword' })
})

router.post('/user/forgotPassword/setPassword', [
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long'),
], verifyPin.setPassword, (req, res) => {

  req.flash('error_message', 'Password sucessfully Changed!')
  res.redirect('/login')
})


/************************************* Register Event **************************************/

router.post('/event/register', auth.checkAuthenticated, async (req, res) => {

  try {
    var eventsToEmail = []

    for (var event in req.body) {
      var indoorEvent = await IndoorEvent.findById(event)
      var outdoorEvent = await OutdoorEvent.findById(event)
      if(indoorEvent) {
        if(indoorEvent.allowRegistration === false ){
          req.flash('error_message', "Registration is full for " + indoorEvent.indoorEvent + ". Try other events ")
         return res.redirect('/eventRegistration?eventFlag=eventRegistration')
        }
      }
      if(outdoorEvent) {
        if(outdoorEvent.allowRegistration === false){
          req.flash('error_message', "Registration is full for " + outdoorEvent.outdoorEvent + ". Try other events ")
          return res.redirect('/eventRegistration?eventFlag=eventRegistration')
        }
      }
  }
    if (Object.keys(req.body).length === 1 || (discount === false && Object.keys(req.body).length > 0)) {
      for (var event in req.body) {
        var indoorEvent = await IndoorEvent.findById(event)
        var outdoorEvent = await OutdoorEvent.findById(event)
        
        if (indoorEvent) {
          var registerEvent = new Registration({
            registeredEvent: indoorEvent.indoorEvent,
            price: indoorEvent.price,
            discountGain: indoorEvent.discountValue,
            eventDescription: indoorEvent.description,
            owner: req.user._id
          })

          var registerUser = new EventRegistration({
            user: req.user.name,
            email: req.user.email,
            price: indoorEvent.price,
            discountGain: indoorEvent.discountValue,
            eventDescription: indoorEvent.description,
            syncRegistrationId: registerEvent._id,
            indoorEvent: indoorEvent.indoorEvent
          })
          registerEvent.syncEventRegistrationId = registerUser._id
          eventsToEmail.push(indoorEvent)
        } else if (outdoorEvent) {
          var registerEvent = new Registration({
            registeredEvent: outdoorEvent.outdoorEvent,
            price: outdoorEvent.price,
            discountGain: outdoorEvent.discountValue,
            eventDescription: outdoorEvent.description,
            owner: req.user._id
          })
          var registerUser = new EventRegistration({
            user: req.user.name,
            price: outdoorEvent.price,
            email: req.user.email,
            discountGain: outdoorEvent.discountValue,
            eventDescription: outdoorEvent.description,
            syncRegistrationId: registerEvent._id,
            outdoorEvent: outdoorEvent.outdoorEvent
          })
          registerEvent.syncEventRegistrationId = registerUser._id
          eventsToEmail.push(outdoorEvent)
        }
        await registerEvent.save()
        await registerUser.save()

      }

      req.flash('error_message', "Registered successfully")
    } else if (Object.keys(req.body).length > 1 && discount === true) {
      for (var event in req.body) {
        var indoorEvent = await IndoorEvent.findById(event)
        var outdoorEvent = await OutdoorEvent.findById(event)
        if (indoorEvent) {
          var discountGot = (indoorEvent.price * indoorEvent.discountValue) / 100
          indoorEvent.price -= discountGot
          var registerEvent = new Registration({
            registeredEvent: indoorEvent.indoorEvent,
            price: indoorEvent.price,
            discountFlag: true,
            discountGain: indoorEvent.discountValue,
            eventDescription: indoorEvent.description,
            owner: req.user._id
          })
          var registerUser = new EventRegistration({
            user: req.user.name,
            price: indoorEvent.price,
            email: req.user.email,
            discountFlag: true,
            discountGain: indoorEvent.discountValue,
            eventDescription: indoorEvent.description,
            syncRegistrationId: registerEvent._id,
            indoorEvent: indoorEvent.indoorEvent
          })
          registerEvent.syncEventRegistrationId = registerUser._id
          eventsToEmail.push(indoorEvent)
        } else if (outdoorEvent) {
          var discountGot = (outdoorEvent.price * outdoorEvent.discountValue) / 100
          outdoorEvent.price -= discountGot
          var registerEvent = new Registration({
            registeredEvent: outdoorEvent.outdoorEvent,
            price: outdoorEvent.price,
            discountFlag: true,
            discountGain: outdoorEvent.discountValue,
            eventDescription: outdoorEvent.description,
            owner: req.user._id
          })
          var registerUser = new EventRegistration({
            user: req.user.name,
            price: outdoorEvent.price,
            email: req.user.email,
            discountFlag: true,
            discountGain: outdoorEvent.discountValue,
            eventDescription: outdoorEvent.description,
            syncRegistrationId: registerEvent._id,
            outdoorEvent: outdoorEvent.outdoorEvent
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
      if (value.indoorEvent) {
        eventsString += value.indoorEvent + ','
      } else {
        eventsString += value.outdoorEvent + ','
      }

    })

    const msg = {
      to: req.user.email,
      from: process.env.FROM_EMAIL,
      subject: 'Event Registration',
      text: 'You have sucessfully registered in: \n' + eventsString + ' events'
    }
    await sgMail.send(msg)

    res.redirect('/eventRegistration?eventFlag=eventRegistration')
  } catch (e) {
    req.flash('error_message', "Somthing thing went wrong. Please try again!")
    res.redirect('/eventRegistration?eventFlag=eventRegistration')
  }
})

/********************************** My Account ************************************/

router.get('/myaccount', auth.checkAuthenticated, async (req, res) => {

  if (req.query.accountOption === 'registeredEvents') {
    await req.user.populate({
      path: 'registration'
    }).execPopulate()
    var eventsTotal = 0
    req.user.registration.forEach((value) => {
      eventsTotal += value.price
    })

    res.render('account', ({ registeredEvents: req.user.registration, eventsTotal, currentUser: req.user, accountOption: 'registeredEvents' }))
  } else if (req.query.accountOption === 'resetPassword') {
    res.render('account', { currentUser: req.user, accountOption: 'resetPassword' })
  } else {
    console.log('error')
  }


})

router.get('/myaccount/registeredEvents/delete/:id', auth.checkAuthenticated, async (req, res) => {

  await Registration.findByIdAndDelete(req.params.id)
  await EventRegistration.findOneAndDelete({ syncRegistrationId: req.params.id })
  res.redirect('/myaccount?accountOption=registeredEvents')
})


// Reset password
router.post('/user/resetPassword', auth.checkAuthenticated, [
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long'),
], async (req, res) => {
  try {
    if (await bcrypt.compare(req.body.oldPassword, req.user.password)) {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const alert = errors.array()
        return res.render('account', { accountOption: 'resetPassword', alert })
      }
      if (req.body.password != req.body.confirmedPassword) {
        return res.render('account', { accountOption: 'resetPassword', err_msg: 'Password not matched!' })
      }
      req.user.password = req.body.password
      await req.user.save()
      req.flash('error_message', 'Password Successfully Changed')
      res.redirect('/myaccount?accountOption=resetPassword')
    } else {
      res.render('account', { accountOption: 'resetPassword', err_msg: 'Old password is wrong!' })
    }
  } catch {
    req.flash('error_message', "Somthing thing went wrong. Please try again!")
    res.redirect('/myaccount?accountOption=resetPassword')
  }
})


module.exports = router