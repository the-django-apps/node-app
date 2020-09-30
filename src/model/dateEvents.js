const mongoose = require('mongoose')



const dateSchema = mongoose.Schema({
    date:{
        type: String,
        required: true
    }

})


dateSchema.virtual('indoorEventDate',{
	ref:'IndoorEvent',
	localField:'date',
	foreignField: 'date'
})


dateSchema.virtual('outdoorEventDate',{
	ref:'OutdoorEvent',
	localField:'date',
	foreignField: 'date'
})


/******** Here this two virtuals are created to connect indoorEvent/outdoorEvent model with dateEvent model
 * 
 * Here the comparision between indoorEvent/outdoorEvent model and dateEvent model is done using date field from both side
 * as we can see localField is date field of dateEvent model and foreignField is date field of indoorEvent/outdoorEvent model
 */

const dateEvent = mongoose.model('DateEvent',dateSchema)

module.exports = dateEvent