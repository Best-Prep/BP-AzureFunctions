const mongoose = require('mongoose')

module.exports = async function (context, req) {
    const CareerDay = require('../models/careerDayModel')
    const RegisteringClass = require('../models/classroomModel')
    context.log('JavaScript HTTP trigger function processed a request.');
    context.log('[COSMOS] Attempting to Connect')
    //Uses mongoose to connect to CosmosDB Mongo API
    await mongoose.connect(process.env.COSMOSDB_CONNSTR+"?ssl=true&replicaSet=globaldb", {
        auth: {
            user: process.env.COSMOSDB_USER,
            password: process.env.COSMOSDB_PASSWORD
        },
        useNewUrlParser: true,

    })
    //If connection successful, print it out
    .then(() => context.log('[COSMOS] Connection to CosmosDB successful'))
    //Catch the error
    .catch((err) => context.log(err));
    let careerDay = await CareerDay.findOne({"id": req.body.careerDayId})
    let foundClassrooms = await RegisteringClass.find({"careerDayId": careerDay.id});
    context.log(foundClassrooms)
    if (foundClassrooms.length > 0) {
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: {
                    message: "CareerDay and Classrooms found successfully.",
                    careerDay: careerDay,
                    classrooms: foundClassrooms
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
                message: "Unable to retrieve data."
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }
};