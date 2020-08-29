function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
  	//Oce loged out this line will not allow user to go back by pressing back button in browser. 
  	//It will throw you at login page
  	res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0')
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}


module.exports = {checkAuthenticated,checkNotAuthenticated}