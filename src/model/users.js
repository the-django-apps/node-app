const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')


const userSchema = mongoose.Schema({
	name: {
		type:String,
		require: true

	},
	email: {
		type:String,
		require: true,
		trim:true,
		lowercase:true
	},
	password: {
		type:String,
		require:true
	}

})


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