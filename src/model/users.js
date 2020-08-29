const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')


const userSchema = mongoose.Schema({
	name: {
		type:String,
		require: true

	},
	email: {
		type:String,
		unique:true,
		require: true,
		trim:true,
		lowercase:true,
		validate(value) {
			if(!validator.isEmail(value)) {
				throw new Error('Email is invalid')
			}
		}
	},
	password: {
		type:String,
		minlength:8,
		require:true

	}

})

// userSchema.methods.generateToken = async function() {
// 	const user = this

// 	const token = await jwt.sign({id: user._id.toString()}, 'thisiseventmanagementtoken')

// 	user.tokens = user.tokens.concat({token})

// 	await user.save()
// 	return token
// }


// userSchema.statics.findByCredentials = async (email,password) =>  {
// 	const user = await User.findOne({email})


// 	if(!user) {
// 		throw new Error('unable to login')
// 	}

// 	const isMatch = await bcrypt.compare(password, user.password)

// 	if(!isMatch) {
// 		throw new Error('unable to login')
// 	}

// 	return user


// }


//Hashing password before saving
userSchema.pre('save', async function(next) {
	const user = this // here this refers to the object which we wants to save eg object.save() now this  will refer to object attached to save function

	if(user.isModified('password')) {   //this will be triggered if the user does a password reset/change or they are setting it for the first time

		user.password = await bcrypt.hash(user.password, 8)

	}           

	next()

})



const User = mongoose.model('User', userSchema)


module.exports = User