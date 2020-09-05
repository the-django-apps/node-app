const mongoose = require('mongoose')


const EventSchema = mongoose.Schema({
	event: {
		type:Buffer

	}
})





const Event = mongoose.model('Event', EventSchema)


module.exports = Event