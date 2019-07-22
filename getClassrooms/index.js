import mongoose from 'mongoose'
const CareerDay = mongoose.model('CareerDays', new mongoose.Schema({
    "id": String,
    "date": Date,
    "schools": [{
        "id": String, //Reference to School Master Id
        "name": String
    }],
    "subjects": [{
        "id": String, //Master Id
        "name": String
    }],
    "sessions": [{
        "id": String,
        "name": String,
        "seats": Number,
        "period": Number,
        "assignedStudents": [{
            "id": String, //Reference to Student Master Id from classroom
            "firstName": String,
            "lastName": String
        }]
    }]
}))

const RegisteringClass = mongoose.model('RegisteringClasses', new mongoose.Schema({
    "id": String, //Master Id
    "careerDayId": String, //References CareerDay Master Id
    "school": {
        "_id": false,
        "id": String, //Reference to School Master Id
        "name": String
    },
    "teacher": {
        "_id": false,
        "firstName": String,
        "lastName": String
    },
    "students": [{
        "id": String, //Master Id
        "firstName": String,
        "lastName": String,
        "preferredSubjects": [{
            "id": String, //Reference to Subject Master Id in CareerDay
            "name": String
        }],
        "schedule": [{ //Index of session represents the period
            "id": String, //Reference to Session Master Id
            "name": String //Name of the subject
        }]
    }],
    "sessions": [{
        "id": String, //Reference to Master Session Id
        "name": String,
        "seats": String,
        "assignedStudents": [{
            "id": String, //Reference to Student Master Id from classroom
            "firstName": String,
            "lastName": String
        }]
    }]
}));

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.log('[COSMOS] Attempting to Connect')
    
    //Uses mongoose to connect to CosmosDB Mongo API
    await mongoose.connect(process.env.COSMOSDB_CONNSTR+"?ssl=true&replicaSet=globaldb", {
        auth: {
            user: process.env.COSMOSDB_USER,
            password: process.env.COSMOSDB_PASSWORD
        },
        useNewUrlParser: true
    })
    //If connection successful, print it out
    .then(() => context.log('[COSMOS] Connection to CosmosDB successful'))
    //Catch the error
    .catch((err) => context.error(err));

    let careerId = CareerDay.findOne({date: req.body.careerDayDate}, 'id')
    if (careerId) {
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: {
                    message: "Classrooms found successfully.",
                    classrooms: RegisteringClass.find({careerDayId: careerId})
            },
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
    }
    else {
        context.res= {
            status: 400,
            body: {
                message: "Unable to retrieve classrooms. Please ensure the date you provided is correct."
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }
};