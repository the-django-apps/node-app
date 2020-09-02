const express = require('express');
const app = express();
const cors = require('cors');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const logger = require('morgan');
const index = require('./api/routes/index');
app.use(cors());
app.use(bodyparser.json());
app.use(logger('common'));
const mongoURL = 'mongodb://localhost:27017/students'
mongoose
  .connect(mongoURL, { useNewUrlParser: true , useUnifiedTopology: true, useCreateIndex : true })
  .then(() => {
    console.log('Database Connected Succesfully');
  })
  .catch((err) => (console.log(err)))
app.use('/api', index);
const port = 5000;
app.listen(5000, () => console.log(`Server is listening on ${port}`));

module.exports = app;
