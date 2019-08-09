const mongoose = require('mongoose');

const CareerDay = mongoose.model('CareerDays', new mongoose.Schema({
    "id": String,
    "date": String,
    "numPeriods": Number,
    "schools": [{
        "id": String, //Reference to School Master Id
        "name": String
    }],
    "subjects": [{
        "id": String, //Master Id
        "name": String
    }],
    "sessions": [{
        "id": String, //Master Id
        "name": String, //Subject Name
        "seats": Number,
        "period": Number,
        "assignedStudents": [{
            "id": String, //Reference to Student Master Id from classroom
            "school": String,
            "firstName": String,
            "lastName": String
        }]
    }]
}))

module.exports = CareerDay;