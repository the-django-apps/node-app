const express = require('express')
const User = require('../model/users.js')
const Gallery = require('../model/gallery')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser');
const auth = require('../setting/auth-middleware')
const multer = require('multer')
const sharp = require('sharp')

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



router.get('/', (req, res) => {
  res.render('index')
})

router.get('/event', (req, res) => {
  res.render('event')
})

router.get('/about', (req, res) => {
  res.render('about')
})

router.get('/contact', (req, res) => {
  res.render('contact')
})

router.get('/gallery', async (req, res) => {
  const gallery = await Gallery.find({})
  res.render('gallery',{gallery})
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
   body('email').isEmail().withMessage('Invalid Email')

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


router.get('/admin',async (req,res) => {
  
  if(req.query.flag === 'gallery') {
      const gallery = await Gallery.find({})
      res.render('admin',{gallery,flag:"gallery"})
  }else if(req.query.flag === 'event') {
      res.render('admin', {flag:"event"})
  } else {
    const userData = await User.find({})
    res.render('admin',{userData:userData})
  }
})

router.get('/admin/deleteuser/:id', async (req,res) => {
  try{
      await User.findByIdAndDelete(req.params.id)
      res.redirect('/admin')
  }catch(e) {
      res.render('404page', {
        errorMsg:'Page not found',
      });
  }
  
})

router.get('/admin/edituser/:id', async(req,res) => {
  try {
    const userData = await User.findById(req.params.id)
    res.render('editUser', {userData:userData})
  } catch(e) {
    res.render('404page', {
        errorMsg:'Page not found',
      });
  }
  
})

router.post('/admin/edituser/:id', [
  body('email').isEmail().withMessage('Invalid Email')

  ]  ,async (req, res) => {
    try{
      const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const alert = errors.array() 
      
      const userData = await User.findById(req.params.id)
      return res.render('editUser' , {alert,userData})
    }

    const currentUser = await User.findOne({email:req.body.email})
    console.log(typeof currentUser._id.toString())
    console.log(typeof req.params.id)
    if(currentUser) {
      if(currentUser._id.toString() !== req.params.id) {
        const userData = await User.findById(req.params.id)
      return res.render('editUser' , {err_msg:"Email Already in Use",userData})
      }
    }
    
    editedUser = {}
    userFields = Object.keys(req.body)
    isAdminFlag = userFields.includes('isAdmin') ? true : false

    for(element in req.body) {
      if(req.body[element] !== '') {
        editedUser[element] = req.body[element] 
      }
    }
    if(isAdminFlag) {
      editedUser['isAdmin'] = true
    }else {
      editedUser['isAdmin'] = false
    }

    const user = await User.findByIdAndUpdate(req.params.id, editedUser)
      
    await user.save()   
    req.flash("success_message","User Updated")
    res.redirect('/admin')
  } catch(e) {
    res.render('404page', {
        errorMsg:'Page not found',
      });
  }
  
    
  
})

const upload = multer({

    limits: {
        fileSize: 1000000
    },
    fileFilter(req,file,cb) {
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
            return cb(new Error('Please upload a jpg or png file'))
        }

        cb(undefined,true)
    }
})


router.post('/admin/gallery/upload',upload.single('photo')  ,async (req,res) => {
  try {
    const buffer = await sharp(req.file.buffer).png().toBuffer()
    const photo = new Gallery()
    photo.photo = buffer

    await photo.save()
    res.redirect('/admin?flag=gallery')
  } catch(e) {
    req.flash('error_message',e.toString())
    res.redirect('/admin?flag=gallery')
  }
    
}, (error,req,res,next) => {
   
    req.flash('error_message',error.message)
    res.redirect('/admin?flag=gallery')
})


router.get('/admin/gallery/api', async (req,res) => {

   try {
        const gallery = await Gallery.find({})

        res.set('Content-Type', 'image/png')
        res.json({gallery:gallery})

    } catch (e) {
        res.status(404).send()
    }

})

router.get('/admin/gallery/:id', async (req,res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)
    res.render('editImage',{gallery,id:req.params.id})
  } catch(e) {
    res.render('404page', {
        errorMsg:'Page not found',
      });
  }
  
})


router.get('/admin/gallery/:id/api', async (req,res) => {
    try {
        const gallery = await Gallery.findById(req.params.id)
        
        res.json(gallery)

    } catch (e) {
        res.status(404).send()
    }
})


router.post('/admin/gallery/update/:id', upload.single('photo') ,async (req,res) => {

    const buffer = await sharp(req.file.buffer).png().toBuffer()
    const gallery = await Gallery.findByIdAndUpdate(req.params.id, {photo:buffer})

    await gallery.save()
    res.redirect('/admin/gallery')
  
},(error,req,res,next) => {
   
    req.flash('error_message',error.message)
    res.redirect('/admin/gallery/'+req.params.id)
})

router.get('/admin/gallery/delete/:id' ,async (req,res) => {

  await Gallery.findByIdAndDelete(req.params.id)

  res.redirect('/admin/gallery')

})

router.get('/admin/events', async (req,res) => {
  res.render('eventsAdmin')
})


router.get('*', (req,res) => {
  res.render('404page', {
    errorMsg:'Page not found',
  });
});

module.exports = router