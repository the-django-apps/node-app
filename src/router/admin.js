const AdminBro = require('admin-bro')
const AdminBroExpress = require('@admin-bro/express')
const AdminBroMongoose = require('@admin-bro/mongoose')
const mongoose = require('mongoose')

AdminBro.registerAdapter(AdminBroMongoose)


const adminBro = new AdminBro({
  databases: [mongoose],
  rootPath: '/admin',
  branding: {
  	companyName: 'Event Management Admin Page'
  }
})


const ADMIN = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
}

const router = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
  authenticate: async (email, password) => {
    if (ADMIN.password === password && ADMIN.email === email) {
      return ADMIN
    }
    return null
  },
  cookieName: process.env.COOKIE_NAME_ADMIN,
  cookiePassword: process.env.COOKIE_PASSWORD_ADMIN,
}, null ,{
  resave: false,
  saveUninitialized: true,
})




module.exports = router