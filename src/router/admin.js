
const express = require('express')
const User = require('../model/users')
const Gallery = require('../model/gallery')
const IndoorEvent = require('../model/indoorEvent')
const OutdoorEvent = require('../model/outdoorEvent')
const Registration = require('../model/registration')
const EventRegistration = require('../model/eventRegistration')
const Contact = require('../model/contactUs')
const DateEvent = require('../model/dateEvents')
const Notice = require('../model/notice')
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
        res.redirect('/')
    }
  ]
};


/***************************************** ADMIN PATHS ****************************************/

/***************************************** User Paths ***********************************/

router.get('/admin', requiresAdmin() ,async (req, res) => {

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
  } else if (req.query.flag === 'eventRegister') {

    const users = await User.find({})
    const indoorEvents = await IndoorEvent.find({})
    const outdoorEvents = await OutdoorEvent.find({})

    var userEvents = []
    var grandTotal = 0;
    
      for (var i = 0; i < indoorEvents.length; i++) {
        await indoorEvents[i].populate({
          path: 'indoorEventPath'
        }).execPopulate()
        
        var singleEventTotal = 0
        indoorEvents[i].indoorEventPath.forEach((value) => {
          singleEventTotal += value.price
        })
        grandTotal += singleEventTotal

        if(indoorEvents[i].indoorEventPath.length > 0) {
          indoorEvents[i].price = singleEventTotal
          indoorEvents[i].indoorEventPath[indoorEvents[i].indoorEventPath.length] = indoorEvents[i]
          userEvents.push(indoorEvents[i].indoorEventPath)
        }
       
      }

      for (var i = 0; i < outdoorEvents.length; i++) {
        const event = await outdoorEvents[i].populate({
          path: 'outdoorEventPath'
        }).execPopulate()

        var singleEventTotal = 0
        outdoorEvents[i].outdoorEventPath.forEach((value) => {
          singleEventTotal += value.price
        })
        grandTotal += singleEventTotal
        if(outdoorEvents[i].outdoorEventPath.length > 0) {
          outdoorEvents[i].price = singleEventTotal
          outdoorEvents[i].outdoorEventPath[outdoorEvents[i].outdoorEventPath.length] = outdoorEvents[i]
          userEvents.push(outdoorEvents[i].outdoorEventPath)
        }               
      }
    res.render('admin', { userEvents, flag: 'eventRegister',grandTotal })
  } else if (req.query.flag === 'contact') {
    const feedbacktList = await Contact.find({})
    res.render('admin',{feedbacktList, flag: 'contact'})
  } else if (req.query.flag === 'notice') {
    
    const notices = await Notice.find({})
    res.render('admin',{notices, flag: 'notice'})
  }else {
    const userData = await User.find({})
    res.render('admin', { userData: userData })
  }
})

router.get('/admin/deleteuser/:id', requiresAdmin() ,async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.redirect('/admin')
  } catch (e) {
    res.render('404page', {
      errorMsg: 'Page not found',
    });
  }

})

router.get('/admin/edituser/:id', requiresAdmin() ,async (req, res) => {
  try {
    const userData = await User.findById(req.params.id)
    res.render('editUser', { userData: userData })
  } catch (e) {
    res.render('404page', {
      errorMsg: 'Page not found',
    });
  }

})

router.post('/admin/edituser/:id', requiresAdmin()  ,[
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


router.post('/admin/gallery/upload', requiresAdmin()  ,upload.single('photo'), async (req, res) => {
  try {
    const buffer = await sharp(req.file.buffer).png().toBuffer()
    const photo = new Gallery()
    photo.photo = buffer

    await photo.save()

    res.redirect('/admin?flag=gallery')
  } catch (e) {
    req.flash('error_message', e.toString())
    return res.redirect('/admin?flag=gallery')
  }

}, (error, req, res, next) => {
  
  req.flash('error_message', error.message)
  res.redirect('/admin?flag=gallery')
})


router.get('/admin/gallery/api', async (req, res) => {

  try {
    const gallery = await Gallery.find({})

    res.set('Content-Type', 'image/png')
    res.json({ gallery: gallery })

  } catch (e) {
    res.status(404).send()
  }

})

router.get('/admin/gallery/:id', requiresAdmin()  ,async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)
    res.render('editImage', { gallery, id: req.params.id })
  } catch (e) {
    res.render('404page', {
      errorMsg: 'Page not found',
    });
  }

})


router.get('/admin/gallery/:id/api', requiresAdmin(), async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)

    res.json(gallery)

  } catch (e) {
    res.status(404).send()
  }
})


router.post('/admin/gallery/update/:id', requiresAdmin() , upload.single('photo'), async (req, res) => {

  const buffer = await sharp(req.file.buffer).png().toBuffer()
  const gallery = await Gallery.findByIdAndUpdate(req.params.id, { photo: buffer })

  await gallery.save()
  res.redirect('/admin/gallery/' + req.params.id)

}, (error, req, res, next) => {

  req.flash('error_message', error.message)
  res.redirect('/admin/gallery/' + req.params.id)
})

router.get('/admin/gallery/delete/:id', requiresAdmin() ,async (req, res) => {

  await Gallery.findByIdAndDelete(req.params.id)

  res.redirect('/admin?flag=gallery')

})

/******************************************* Events **************************************/

router.get('/admin/discount', requiresAdmin() , (req,res) => {
  
  
    if(req.query.discount === 'set') {
      discount = true
    }else if(req.query.discount === 'unset'){
      discount = false
     }

  res.redirect('/admin?flag=event')
})

/****** Date Validation Function *******/
dateValidation = function() {
  return function(req,res,next) {
    if(req.body.day && req.body.month && req.body.year) {
      var valideDate = new Date(req.body.year+"-"+req.body.month+"-"+req.body.day)
     
      if((valideDate.getDate() !== parseInt(req.body.day)) || (valideDate.toString() === 'Invalid Date')  ) {
        req.flash("error_message", 'Invalid Date')
        return res.redirect('/admin?flag=event')
      }     
      next()
    } else{
      req.flash("error_message", 'All Fields are required')
        res.redirect('/admin?flag=event')
    }
    
  }
}

router.post('/admin/indoorevent/add', requiresAdmin() , dateValidation() ,[
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
    
  }),
  body('indoorEvent').custom(value => {
    return IndoorEvent.findOne({indoorEvent:value}).then(event => {
      if (event) {
        return Promise.reject('Event already exist')
      }
    })
  })
]  ,async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array() 
      req.flash('alert_msg', alert)
      return res.redirect('/admin?flag=event')
    }

    req.body.description = req.body.description.replace("<", "&lt");
    req.body.description = req.body.description.replace(">", "&gt");
    req.body.description = req.body.description.replace('"', "&quot");
    req.body.description = req.body.description.replace("'", "&apos");
    req.body.description = req.body.description.replace("(", "&#40");
    req.body.description = req.body.description.replace(")", "&#41");
    req.body.description = req.body.description.replace("!", "&#33");
    req.body.description = req.body.description.replace(":", "&#58");
    req.body.description = req.body.description.replace(";", "&#59");
    req.body.description = req.body.description.replace("=", "&#61");
    req.body.description = req.body.description.replace("?", "&#63");
    req.body.description = req.body.description.replace("/", "&#47");
    req.body.description = req.body.description.replace("{", "&#123");
    req.body.description = req.body.description.replace("}", "&#125");
    req.body.description = req.body.description.replace("`", "&#96");
    
    const oldDate = await DateEvent.findOne({date:new Date(req.body.year+"-"+req.body.month+"-"+req.body.day)})
     /****** This  verification is done to keep all date unique in dateEvent model
      *  but if two objects of same date is created then there will be (ambiguity) conflict between two object. 
      * It means that, interpretar will find two objects have same date than it will repeat same result two time. 
      * Means it will find all the result of first date then again it will give same result for second date (if first and second are same) ********/
      
    if(!oldDate){ 
     const date = new DateEvent({date:new Date(req.body.year+"-"+req.body.month+"-"+req.body.day)})
      await date.save()     
    } 
    
    const event = new IndoorEvent({...req.body,date:new Date(req.body.year+"-"+req.body.month+"-"+req.body.day)})
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

router.post('/admin/outdoorevent/add', requiresAdmin() ,dateValidation(),[
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
] , async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array() 
      req.flash('alert_msg', alert)
      return res.redirect('/admin?flag=event')
    }

    req.body.description = req.body.description.replace("<", "&lt");
    req.body.description = req.body.description.replace(">", "&gt");
    req.body.description = req.body.description.replace('"', "&quot");
    req.body.description = req.body.description.replace("'", "&apos");
    req.body.description = req.body.description.replace("(", "&#40");
    req.body.description = req.body.description.replace(")", "&#41");
    req.body.description = req.body.description.replace("!", "&#33");
    req.body.description = req.body.description.replace(":", "&#58");
    req.body.description = req.body.description.replace(";", "&#59");
    req.body.description = req.body.description.replace("=", "&#61");
    req.body.description = req.body.description.replace("?", "&#63");
    req.body.description = req.body.description.replace("/", "&#47");
    req.body.description = req.body.description.replace("{", "&#123");
    req.body.description = req.body.description.replace("}", "&#125");
    req.body.description = req.body.description.replace("`", "&#96");
    
    const oldDate = await DateEvent.findOne({date:new Date(req.body.year+"-"+req.body.month+"-"+req.body.day)})

    if(!oldDate){ 
      const date = new DateEvent({date:new Date(req.body.year+"-"+req.body.month+"-"+req.body.day)})
       await date.save()
    }
    const event = new OutdoorEvent({...req.body,date:new Date(req.body.year+"-"+req.body.month+"-"+req.body.day)})
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

router.get('/admin/indooreventDelete/:id', requiresAdmin() ,  async (req, res) => {
  await IndoorEvent.findByIdAndDelete(req.params.id)
  req.flash('optionFlag', 'indoor')
  res.redirect('/admin?flag=event')
})

router.get('/admin/outdooreventDelete/:id', requiresAdmin() , async (req, res) => {
  await OutdoorEvent.findByIdAndDelete(req.params.id)
  req.flash('optionFlag', 'outdoor')
  res.redirect('/admin?flag=event')
})




/***************************** Registration Event *************************************/

router.post('/registerEvent/payment/:id', requiresAdmin() ,async (req,res) => {
  try{
        
    if(await EventRegistration.findById(req.params.id)) {
      await EventRegistration.findByIdAndUpdate(req.params.id,req.body)
      await Registration.findOneAndUpdate({syncEventRegistrationId:req.params.id},req.body)
      return res.redirect('/admin?flag=eventRegister')
    } 
      await Registration.findByIdAndUpdate(req.params.id,req.body)
      await EventRegistration.findOneAndUpdate({syncRegistrationId:req.params.id},req.body)

      res.redirect('/admin?flag=register')  
  } catch(e) {
    req.flash('error_message','Somthing went wrong. Please try again')
    res.redirect('/admin?flag=register')
  }
  
})

router.get('/registerEvent/delete/:id', requiresAdmin() ,async (req, res) => {
  if(await EventRegistration.findById(req.params.id)) {
    await EventRegistration.findByIdAndDelete(req.params.id)
    await Registration.findOneAndDelete({syncEventRegistrationId:req.params.id})
    return res.redirect('/admin?flag=eventRegister')
  }
  await Registration.findByIdAndDelete(req.params.id)
  await EventRegistration.findOneAndDelete({syncRegistrationId:req.params.id})
  res.redirect('/admin?flag=register')

})


/**********************************Contact Us *********************************/

router.post('/admin/contact' , async (req,res) => {
  const feedbacktList = await Contact.find({})
  res.render('contacttUsAdmin',{feedbacktList})
} )

module.exports = router


/********************************* Notice *********************************************/



router.post('/admin/notice', requiresAdmin(),async (req,res) => {
  try{
    req.body.heading = req.body.heading.replace("<", "&lt");
    req.body.heading = req.body.heading.replace(">", "&gt");
    req.body.heading = req.body.heading.replace('"', "&quot");
    req.body.heading = req.body.heading.replace("'", "&apos");
    req.body.heading = req.body.heading.replace("(", "&#40");
    req.body.heading = req.body.heading.replace(")", "&#41");
    req.body.heading = req.body.heading.replace("!", "&#33");
    req.body.heading = req.body.heading.replace(":", "&#58");
    req.body.heading = req.body.heading.replace(";", "&#59");
    req.body.heading = req.body.heading.replace("=", "&#61");
    req.body.heading = req.body.heading.replace("?", "&#63");
    req.body.heading = req.body.heading.replace("/", "&#47");
    req.body.heading = req.body.heading.replace("{", "&#123");
    req.body.heading = req.body.heading.replace("}", "&#125");
    req.body.heading = req.body.heading.replace("`", "&#96");

    req.body.notice = req.body.notice.replace("<", "&lt");
    req.body.notice = req.body.notice.replace(">", "&gt");
    req.body.notice = req.body.notice.replace('"', "&quot");
    req.body.notice = req.body.notice.replace("'", "&apos");
    req.body.notice = req.body.notice.replace("(", "&#40");
    req.body.notice = req.body.notice.replace(")", "&#41");
    req.body.notice = req.body.notice.replace("!", "&#33");
    req.body.notice = req.body.notice.replace(":", "&#58");
    req.body.notice = req.body.notice.replace(";", "&#59");
    req.body.notice = req.body.notice.replace("=", "&#61");
    req.body.notice = req.body.notice.replace("?", "&#63");
    req.body.notice = req.body.notice.replace("/", "&#47");
    req.body.notice = req.body.notice.replace("{", "&#123");
    req.body.notice = req.body.notice.replace("}", "&#125");
    req.body.notice = req.body.notice.replace("`", "&#96");

    const notice = new Notice(req.body)
    await notice.save()

    req.flash('error_message','Notice submited!')
    res.redirect('/admin?flag=notice')
  }catch {
    req.flash('error_message','Something went wrong! Please try again.')
    res.redirect('/admin?flag=notice')
  }
})


router.get('/admin/noticeDelete/:id', requiresAdmin(), async (req,res) => {
  try{
  await Notice.findByIdAndDelete(req.params.id)
  res.redirect('/admin?flag=notice')
}catch {
  req.flash('error_message','Something went wrong! Please try again.')
  res.redirect('/admin?flag=notice')
}
} )