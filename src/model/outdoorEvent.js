const mongoose = require('mongoose')


const outdoorEventSchema = mongoose.Schema({
	outdoorEvent: {
		type:String,
		required:true

	},
	description: {
		type:String,
		required:true
	}
})





const outdoorEvent = mongoose.model('OutdoorEvent', outdoorEventSchema)


module.exports = outdoorEvent