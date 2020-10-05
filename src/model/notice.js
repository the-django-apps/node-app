const mongoose = require('mongoose')

const noticeSchema = mongoose.Schema({
    heading:{
        type:String
    },
    notice: {
        type:String
    }
})



const notice = mongoose.model('Notice',noticeSchema)


module.exports = notice