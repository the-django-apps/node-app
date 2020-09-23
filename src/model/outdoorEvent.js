const mongoose = require('mongoose')


const outdoorEventSchema = mongoose.Schema({
	outdoorEvent: {
		type:String,
		require:true

	},
	description: {
		type:String
	}
})





const outdoorEvent = mongoose.model('OutdoorEvent', outdoorEventSchema)


module.exports = outdoorEvent