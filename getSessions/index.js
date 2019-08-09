var mongoose = require('mongoose');

module.exports = async function (context, req) {
    const mongooseCareerDay = require('../models/careerDayModel')
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.body && req.body.careerDayId) {
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
        let foundCareerDay = await mongooseCareerDay.findOne({"id": req.body.careerDayId});
        context.log(foundCareerDay.sessions)
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: {
                message: "CareerDay found successfully.",
                sessions: foundCareerDay.sessions,
            },
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a CareerDay ID within the request body"
        };
    }
};