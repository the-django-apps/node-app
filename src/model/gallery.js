const mongoose = require('mongoose')


const gallerySchema = mongoose.Schema({
	photo: {
		type:Buffer

	}
})

gallerySchema.pre('save', async function(next) {
	const gallery = await Gallery.find({})	

	if(gallery.length >= 20) {
		throw new  Error('You can upload only 20 images')
	}

	next()

})




const Gallery = mongoose.model('Gallery', gallerySchema)


module.exports = Gallery