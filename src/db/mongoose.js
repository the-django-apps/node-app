const mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1/event-management', {
	useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})