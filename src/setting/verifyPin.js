const sgMail = require('@sendgrid/mail')
const { body, validationResult } = require('express-validator');
const User = require('../model/users')
sgMail.setApiKey(process.env.SEND_GRID_KEY)

function verifyPin(req,res,next) {
    
    if(typeof pin === 'undefined') {
        req.flash('error_message', 'Something went wrong. Please try again')
        return res.redirect('/user/forgotPassword')
    } else {
        if(req.body.pin == pin) {
            return next()
        }
    }
   
    
    req.flash('error_message', 'Something went wrong. Please try again')
    return res.redirect('/user/forgotPassword')
    
    
}

async function sendPin(req,res,next) {
    try {
        user = await User.findOne({email:req.body.email})
        if(!user) {
            req.flash('error_message', 'Something went wrong. Please try again!')
            return res.redirect('/user/forgotPassword') 
        }

        
        pin = await  Math.floor(1000 + Math.random() * 9000); 
        const msg = {
            to: req.body.email,
            from: process.env.FROM_EMAIL,
            subject: 'Forgot Password',
            text: 'Pin to change password: ' + pin
          }
        await sgMail.send(msg)
        next()
    } catch(e) {
        req.flash('error_message', 'Something went wrong')
        return res.redirect('/login')
    }
   
}

async function setPassword(req,res,next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const alert = errors.array()    
      return res.render('forgotPassword',{sendOption:'setPassword',alert})
    }

    if(typeof user === 'undefined') {
        req.flash('error_message', 'Something went wrong')
        return res.redirect('/user/forgotPassword') 
    }

    if(req.body.password !== req.body.confirmedPassword) { 
        return res.render('forgotPassword',{sendOption:'setPassword',err_msg:'Password does not match!'})     
    }

    user.password = req.body.password
    await user.save()
    next()
} 

module.exports = {verifyPin,sendPin,setPassword}