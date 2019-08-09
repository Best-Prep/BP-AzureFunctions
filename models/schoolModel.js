const mongoose = require('mongoose');

const School = mongoose.model('Schools', new mongoose.Schema({
    "id": String, //Master Id
    "name": String,
}))

module.exports = School;