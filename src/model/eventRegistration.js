const mongoose = require('mongoose')

const eventRegisteredSchema = mongoose.Schema({
    user: {
        type:String,
        required: true
	},
	email: {
		type:String,
		required: true,
	},
    price: {
        type:Number,
        required:true
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
	syncRegistrationId:{
		type: mongoose.Schema.Types.ObjectId
	},
	indoorEventId: {
		type:mongoose.Schema.Types.ObjectId,
		ref:'IndoorEvent'
	},
	outdoorEventId: {
		type:mongoose.Schema.Types.ObjectId,
		ref:'OutdoorEvent'
	}
})

/***** Here the syncRegistrationId is used to sync eventRegistered model and Register model
 * like if we delete any thing from this model than using the syncRegistrationId
 *  of Register model we can delete object from Register Model also.
 * 
 * 
 * This things are done due to user wise registration and event wise registration on admin side.
 */


/*********** The indoorEventId/outdoorEventId field is used to store the object id from IndoorEvent/outdoorEvent model 
 * By comparing _id field of IndoorEvent/outdoorEvent model and indoorEventId/outdoorEventId field of 
 * eventRegistered model we retrives the matched id data from eventRegistered model.
 * 
 * 
 * The above explation is actual, if we want all the registered user of any event 
 * then we will compare the id of that event with the indoorEventId/outdoorEventId field
 *  from this(eventRegistered) model.
 */



const eventRegistered = mongoose.model('eventRegistered',eventRegisteredSchema)


module.exports = eventRegistered