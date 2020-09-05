const mongoose = require('mongoose')


const gallerySchema = mongoose.Schema({
	photo: {
		type:Buffer

	}
})





const Gallery = mongoose.model('Gallery', gallerySchema)


module.exports = Gallery