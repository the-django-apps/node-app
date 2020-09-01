const path = require('path')
const express = require('express')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bodyParser = require('body-parser')
const userRoute = require('./router/users')
const adminRouter = require('./router/admin')
require('./db/mongoose')

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')
const viewDirectoryPath = path.join(__dirname, '../templates/views')
const app = express()


app.set('view engine', 'ejs');
app.set('views', viewDirectoryPath)
 
app.use(express.static(publicDirectoryPath))

app.use('/admin',adminRouter)
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(userRoute)

app.listen(port, () => {
	console.log('Server is up on ' + port)
})