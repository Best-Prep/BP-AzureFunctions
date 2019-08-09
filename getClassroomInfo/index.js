var mongoose = require('mongoose');

module.exports = async function (context, req) {
    const mongooseClassroom = require('../models/classroomModel')
    const mongooseCareerDay = require('../models/careerDayModel')
    context.log('JavaScript HTTP trigger function processed a request.');
    if (req.body && req.body.classId) {
        if(mongoose.connection.readyState == 0){
            await mongoose.connect(process.env.COSMOSDB_CONNSTR +"?ssl=true&replicaSet=globaldb", {
                auth: {
                    user: process.env.COSMOSDB_USER,
                    password: process.env.COSMOSDB_PASSWORD
                },
                useNewUrlParser: true
            })
            //If connection successful, print it out
            .then(() => context.log('[COSMOS] Connection to CosmosDB successful'))
            //Catch the error
            .catch((err) => context.log(err));
        }
        let foundClass = await mongooseClassroom.findOne({"id": req.body.classId});
        context.log(foundClass.students)
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: {
                message: "Students found successfully.",
                students: foundClass.students,
                teacherName: foundClass.teacher.firstName + " " + foundClass.teacher.lastName,
                school: foundClass.school.name
            },
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a classroom ID within the request body"
        };
    }
};