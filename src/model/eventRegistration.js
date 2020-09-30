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



const eventRegistered = mongoose.model('eventRegistered',eventRegisteredSchema)


module.exports = eventRegistered