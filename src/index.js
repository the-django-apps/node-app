const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const userRoute = require('./router/users')
const adminRoute = require('./router/admin')
discount = false;

const cors = require('cors')
require('./db/mongoose')


const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')
const viewDirectoryPath = path.join(__dirname, '../templates/views')

const app = express()

app.use(cors())
app.set('view engine', 'ejs');
app.set('views', viewDirectoryPath)
app.use(express.static(publicDirectoryPath))

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(userRoute)
app.use(adminRoute)

app.get('*', (req, res) => {
	res.render('404page', {
	  errorMsg: 'Page not found',
	});
  });


app.listen(port, () => {
	console.log('Server is up on ' + port)
})


// function dateValidation() {
// 	var d = new Date("2015-02-32");
// 	console.log(d)
// }

// dateValidation()