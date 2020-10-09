const mongoose = require('mongoose')


randomisedUserSchema = mongoose.Schema({
    randomisedUserList: {
        type:Array
    },
    event:{
        type:String
    }
})




const randomisedUsers = mongoose.model('RandomisedUsers',randomisedUserSchema)


module.exports = randomisedUsers