const mongoose = require('mongoose')


const registerSchema = mongoose.Schema({
	registeredEvent: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required:true
	},
	eventDescription: {
		type: String,
		required: true
	},
	discountGain: {
		type: Number
	},
	discountFlag: {
		type: Boolean,
		default: false
	},
	owner: {
		type:mongoose.Schema.Types.ObjectId,
		required: true,
		ref:'User'
	}

})




const Register = mongoose.model('Register', registerSchema)

module.exports = Register