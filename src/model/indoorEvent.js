const mongoose = require('mongoose')


const indoorEventSchema = mongoose.Schema({
	indoorEvent: {
		type:String,
		required:true

	},
	price: {
		type: Number,
		required:true
	},
	discountValue: {
		type: Number,
		default: 0
	},
	description: {
		type:String,
		required: true
	}
})


const indoorEvent = mongoose.model('IndoorEvent', indoorEventSchema)


module.exports = indoorEvent