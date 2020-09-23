const mongoose = require('mongoose')


const indoorEventSchema = mongoose.Schema({
	indoorEvent: {
		type:String,
		require:true

	},
	description: {
        type:String
    }
})


const indoorEvent = mongoose.model('IndoorEvent', indoorEventSchema)


module.exports = indoorEvent