const mongoose = require('mongoose')


const outdoorEventSchema = mongoose.Schema({
	outdoorEvent: {
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
		required:true
	}
})

outdoorEventSchema.virtual('outdoorEventPath', {
	ref: 'eventRegistered',
	localField: 'outdoorEvent',
	foreignField: 'outdoorEvent'
})

/******** The above virtual is used to connect eventRegistered model OutdoorEvent model 
 * The localField refers to id of OutdoorEvent.
 * The foreignField refers to the field which will store the id of OutdoorEvent object 
 * but in objects of eventRegistered model .
 * 
 * 
 * 
 * 
 * To know more about this go to file eventRegistered model.
 */



const outdoorEvent = mongoose.model('OutdoorEvent', outdoorEventSchema)


module.exports = outdoorEvent