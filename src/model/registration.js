const mongoose = require('mongoose')


const eventRegisterSchema = mongoose.Schema({
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
	payment: {
		type: String,
		default: 'no'
	},
	discountGain: {
		type: Number
	},
	discountFlag: {
		type: Boolean,
		default: false
	},
	syncEventRegistrationId:{
		type: mongoose.Schema.Types.ObjectId
	},
	owner: {
		type:mongoose.Schema.Types.ObjectId,
		required: true,
		ref:'User'
	}

})





const Register = mongoose.model('Register', eventRegisterSchema)

module.exports = Register