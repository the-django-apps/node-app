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


/***** Here the syncEventRegistrationId is used to sync eventRegistered model and Register model
 * like if we delete any thing from this model than using the syncEventRegistrationId
 *  of eventRegistered model we can delete object from eventRegistered Model also.
 * 
 * 
 * This things are done due to user wise registration and event wise registration on admin side.
 */

/***********
 * The 'owner' field here is used to store the id of owner
 *  to get all the regiesterd events of that user.
 *
 * */





const Register = mongoose.model('Register', eventRegisterSchema)

module.exports = Register