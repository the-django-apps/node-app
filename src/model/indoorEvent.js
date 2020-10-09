const mongoose = require('mongoose')


const indoorEventSchema = mongoose.Schema({
	indoorEvent: {
		type:String,
		required:true

	},
	date:{
		type: Date,
		ref:'DateEvent'
	},
	price: {
		type: Number,
		required:true
	},
	discountValue: {
		type: Number,
		default: 0
	},
	allowRegistration: {
		type: Boolean,
		default: true
	},
	description: {
		type:String,
		required: true
	}
})

indoorEventSchema.virtual('indoorEventPath', {
	ref: 'eventRegistered',
	localField: 'indoorEvent',
	foreignField: 'indoorEvent'
})

/******** The above virtual is used to connect eventRegistered model IndoorEvent model  
 * The localField refers to id of IndoorEvent.
 * The foreignField refers to the field which will store the id of IndoorEvent object 
 * but in objects of eventRegistered model .
 * 
 * 
 * 
 * To know more about this go to file eventRegistered model.
*/


const indoorEvent = mongoose.model('IndoorEvent', indoorEventSchema)


module.exports = indoorEvent