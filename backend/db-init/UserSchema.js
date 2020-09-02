const express = require('express');
const mongoose = require('mongoose');

let userSchema = new mongoose.Schema(
  {
    name: {type: String, required: true, index: true},
    email: {type:String, required: true, unique: true},
    password: {type: String},
    address: {type: String},
    contact: [{type:Number}],
    // subjects: [{type: mongoose.Schema.Types.ObjectId}],
  },
  {collection: 'students'}
);

let userModel = mongoose.model('user', userSchema);
module.exports = userModel;