
const express = require('express')
const User = require('../model/users')
const Gallery = require('../model/gallery')
const IndoorEvent = require('../model/indoorEvent')
const OutdoorEvent = require('../model/outdoorEvent')
const Registration = require('../model/registration')
const Contact = require('../model/contactUs')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const verifyPin = require('../setting/verifyPin')
const auth = require('../setting/auth-middleware')
const multer = require('multer')
const cookieParser = require('cookie-parser');
const sharp = require('sharp')

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SEND_GRID_KEY)

const { body, validationResult } = require('express-validator');


const router = new express.Router()


const requiresAdmin = function () {
  return [
    auth.checkAuthenticated,
    function (req, res, next) {
      if (req.user && req.user.isAdmin === true)
        next();
      else
        res.status(401).send('Unauthorized');
    }
  ]
};


/***************************************** ADMIN PATHS ****************************************/

/*****************************************User Paths ***********************************/

router.get('/admin',  async (req, res) => {

  if (req.query.flag === 'gallery') {
    const gallery = await Gallery.find({})
    res.render('admin', { gallery, flag: "gallery" })
  } else if (req.query.flag === 'event') {
    const indoorevents = await IndoorEvent.find({})
    const outdoorevents = await OutdoorEvent.find({})
    res.render('admin', { indoorevents, outdoorevents, flag: "event" , discount: discount })
  } else if (req.query.flag === 'register') {

    const users = await User.find({})

    var userEvents = []
    var grandTotal = 0;
    for (var i = 0; i < users.length; i++) {
      await users[i].populate({
        path: 'registration'
      }).execPopulate()

      var singleMemberTotal = 0
      users[i].registration.forEach((event) => {
        
        if(event.discountFlag === true) {
          discountValue = (event.price * event.discountGain)/100
          event.price -= discountValue
      }
        
        singleMemberTotal += event.price
      })
      
      
      grandTotal += singleMemberTotal 
      if (users[i].registration.length !== 0) {
        users[i].password = undefined
        users[i].price = singleMemberTotal
        users[i].registration[users[i].registration.length] = users[i]

        userEvents.push(users[i].registration)
      }
    }
    
    res.render('admin', { userEvents, flag: 'register',grandTotal })
  } else if (req.query.flag === 'contact') {
    const feedbacktList = await Contact.find({})
    res.render('admin',{feedbacktList, flag: 'contact'})
  } else {
    const userData = await User.find({})
    res.render('admin', { userData: userData })
  }
})

router.get('/admin/deleteuser/:id',  async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.redirect('/admin')
  } catch (e) {
    res.render('404page', {
      errorMsg: 'Page not found',
    });
  }

})

router.get('/admin/edituser/:id',  async (req, res) => {
  try {
    const userData = await User.findById(req.params.id)
    res.render('editUser', { userData: userData })
  } catch (e) {
    res.render('404page', {
      errorMsg: 'Page not found',
    });
  }

})

router.post('/admin/edituser/:id',  [
  body('email').isEmail().withMessage('Invalid Email')

], async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const alert = errors.array()

      const userData = await User.findById(req.params.id)
      return res.render('editUser', { alert, userData })
    }

    const currentUser = await User.findOne({ email: req.body.email })

    if (currentUser) {
      if (currentUser._id.toString() !== req.params.id) {
        const userData = await User.findById(req.params.id)
        return res.render('editUser', { err_msg: "Email Already in Use", userData })
      }
    }

    editedUser = {}
    userFields = Object.keys(req.body)
    isAdminFlag = userFields.includes('isAdmin') ? true : false

    for (element in req.body) {
      if (req.body[element] !== '') {
        editedUser[element] = req.body[element]
      }
    }
    if (isAdminFlag) {
      editedUser['isAdmin'] = true
    } else {
      editedUser['isAdmin'] = false
    }

    const user = await User.findByIdAndUpdate(req.params.id, editedUser)

    await user.save()
    req.flash("success_message", "User Updated")
    res.redirect('/admin')
  } catch (e) {
    res.render('404page', {
      errorMsg: 'Page not found',
    });
  }



})

/****************************************** Gallery *********************************/

const upload = multer({

  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
      return cb(new Error('Please upload a jpg or png file'))
    }

    cb(undefined, true)
  }
})


router.post('/admin/gallery/upload',  upload.single('photo'), async (req, res) => {
  try {
    const buffer = await sharp(req.file.buffer).png().toBuffer()
    const photo = new Gallery()
    photo.photo = buffer

    await photo.save()

    res.redirect('/admin?flag=gallery')
  } catch (e) {

    req.flash('error_message', e.toString())
    res.redirect('/admin?flag=gallery')
  }

}, (error, req, res, next) => {

  req.flash('error_message', error.message)
  res.redirect('/admin?flag=gallery')
})


router.get('/admin/gallery/api',  async (req, res) => {

  try {
    const gallery = await Gallery.find({})

    res.set('Content-Type', 'image/png')
    res.json({ gallery: gallery })

  } catch (e) {
    res.status(404).send()
  }

})

router.get('/admin/gallery/:id',  async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)
    res.render('editImage', { gallery, id: req.params.id })
  } catch (e) {
    res.render('404page', {
      errorMsg: 'Page not found',
    });
  }

})


router.get('/admin/gallery/:id/api',  async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)

    res.json(gallery)

  } catch (e) {
    res.status(404).send()
  }
})


router.post('/admin/gallery/update/:id',  upload.single('photo'), async (req, res) => {

  const buffer = await sharp(req.file.buffer).png().toBuffer()
  const gallery = await Gallery.findByIdAndUpdate(req.params.id, { photo: buffer })

  await gallery.save()
  res.redirect('/admin/gallery/' + req.params.id)

}, (error, req, res, next) => {

  req.flash('error_message', error.message)
  res.redirect('/admin/gallery/' + req.params.id)
})

router.get('/admin/gallery/delete/:id', async (req, res) => {

  await Gallery.findByIdAndDelete(req.params.id)

  res.redirect('/admin?flag=gallery')

})

/******************************************* Events **************************************/

router.post('/admin/discount',(req,res) => {
  
  for(var value in req.body) {
    if(value === 'discount') {
      discount = true
    }else if(value === 'noDiscount'){
      discount = false
     }
  }
  
  res.redirect('/admin?flag=event')
})


router.post('/admin/indoorevent/add', [
  body('price').custom(value => {
    if(isNaN(value)) {
       throw new Error('Price is not a number')
    } else {
      return true
    }
  }),
  body('discountValue').custom(value => {
    if(value) {
      if(isNaN(value)) {
        throw new Error('Discount value is not a number')
     } else {
       return true
     }
    } else {
      return true
    }
    
  })
]  ,async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array() 
      req.flash('alert_msg', alert)
      res.redirect('/admin?flag=event')
    }

    const event = new IndoorEvent(req.body)
    await event.save()
    req.flash('optionFlag', 'indoor')
    res.redirect('/admin?flag=event')
  } catch (e) {
    if (e.toString().includes('required')) {
      req.flash("error_message", 'All Fields are required')
      res.redirect('/admin?flag=event')
    } else {
      req.flash("error_message", 'Somthing went wrong. Please try again!')
      res.redirect('/admin?flag=event')
    }
  }

})

router.post('/admin/outdoorevent/add', [
  body('price').custom(value => {
    if(isNaN(value)) {
       throw new Error('Price is not a number')
    } else {
      return true
    }
  })
] , async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('alert_msg', alert)
      res.redirect('/admin?flag=event')
    }
    const event = new OutdoorEvent(req.body)
    await event.save()
    req.flash('optionFlag', 'outdoor')
    res.redirect('/admin?flag=event')
  } catch (e) {
    if (e.toString().includes('required')) {
      req.flash("error_message", 'All Fields are required')
      res.redirect('/admin?flag=event')
    } else {
      req.flash("error_message", 'Somthing went wrong. Please try again!')
      res.redirect('/admin?flag=event')
    }
  }
})

router.get('/admin/indooreventDelete/:id',  async (req, res) => {
  await IndoorEvent.findByIdAndDelete(req.params.id)
  req.flash('optionFlag', 'indoor')
  res.redirect('/admin?flag=event')
})

router.get('/admin/outdooreventDelete/:id',  async (req, res) => {
  await OutdoorEvent.findByIdAndDelete(req.params.id)
  req.flash('optionFlag', 'outdoor')
  res.redirect('/admin?flag=event')
})




/***************************** Registration Event *************************************/

router.get('/registerEvent/delete/:id',  async (req, res) => {
  await Registration.findByIdAndDelete(req.params.id)
  res.redirect('/admin?flag=register')
})


router.get('*', (req, res) => {
  res.render('404page', {
    errorMsg: 'Page not found',
  });
});

/**********************************Contact Us *********************************/
router.post('/contact', [
  body('email').isEmail().withMessage('Invalid Email'),
  body('mobileNumber').custom(value => {
    if(isNaN(value)) {
     throw new Error('Mobile number is not a number')
    }else if(value.length != 10) {
     throw new Error('Mobile number must be 10 digit')
    } else {
      return true
    }
  }),
  body('feedback').custom(value => {
    if(value.length > 500) {
     throw new Error('Please keep feedback with 500 characters only')
    } else {
      return true
    }
  })
] , async (req, res) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array() 
      return res.render('contact' , {alert})
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
  } catch(e) {
    req.flash('success_message', 'Something went wrong. Please try again')
    res.redirect('/contact')
  }
  
})


router.post('/admin/contact' , async (req,res) => {
  const feedbacktList = await Contact.find({})
  res.render('contacttUsAdmin',{feedbacktList})
} )

module.exports = router