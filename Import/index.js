var uniqid = require('uniqid');
var GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util')

module.exports = async function (context, req) {
    if(req.body.careerDayDate && req.body.sheetLink){
        var uniqid = require('uniqid');
        context.log('JavaScript HTTP trigger function processed a request.');
        //context.log('[COSMOS] Attempting to Connect')
        //Uses mongoose to connect to CosmosDB Mongo API
        // await mongoose.connect('mongodb://bestprep-mongo.documents.azure.com:10255/bestprep-mongo'+"?ssl=true&replicaSet=globaldb", {
        //     auth: {
        //         user: "bestprep-mongo",
        //         password: "Krijb1glTape5XhoAp1VvUa14s1mlWRUNjDnGBegcXtDEPDEWAzwtOV8LwKJCuswl6iDHbhZt1cQ8HHMPkzd2w=="
        //     },
        //     useNewUrlParser: true
        // })
        // //If connection successful, print it out
        // .then(() => context.log('[COSMOS] Connection to CosmosDB successful'))
        // //Catch the error
        // .catch((err) => context.error(err));
        var str = req.body.sheetLink; //This gets the sheetLink from the request object
        //TODO: Documentation for this, but also move the code from Repl.it when ready
        /*This matches the 16 characters in between the back slashes ('/'), 
        thus grabbing the sheet ID required to connect to the sheet*/
        var sheetId = str.match(/([^\/]+){16}/)[0];
        var doc = new GoogleSpreadsheet(sheetId);
        var creds = {
            client_email: process.env.DOCS_CLIENT_EMAIL,
            private_key: process.env.DOCS_PRIVATE_KEY
        }
        //Connects to the google sheet using the credentials provided by the environmental variabels
        await promisify(doc.useServiceAccountAuth)(creds);
        const info = await promisify(doc.getInfo)();
        const sheet = info.worksheets[0];
        const rows = await promisify(sheet.getRows)({
            offset: 1
        })
        let students = [{}]
        let newCareerDay = {
            "id": uniqid(),
            "date": req.body.careerDayDate,
            "schools": [],
            "subjects": [],
            "sessions": []
        }
        let schools = [] //Holds what schools exist
        let registeringClasses = []

        const cleaner = (value, index, array) => {
            /* If the school is not already in the system, then create a new school object
            and add it to the schools array */
            let preferences = []
            //For every key in value (the row we are looking at from Google sheets)
            //TODO: Add functionality to generate new subjects based on preferences
            for (var key in value) { //FIXME: This could probably be optimized in some way
                if (/preferences\d{1}/.test(key) && !(value[key] === 'No Preference')) {
                    if (!newCareerDay.subjects.find(subject => subject.name === value[key])) {
                        newCareerDay.subjects.push({
                            "id": uniqid(), //Master Id
                            "name": value[key]
                        })
                    }
                    context.log(value[key])
                    preferences.push(newCareerDay.subjects.find(e => e.name === value[key])) 
                }
            }
            if (!schools.find(e => e.name === value.school)) {
                let newId = uniqid();
                schools = [...schools, {
                    "id": newId,
                    "name": value.school,
                }]
                newCareerDay.schools = [...newCareerDay.schools, {
                    "id": newId,
                    "name": value.school
                }]
            }
            /*TODO: 
                - Add else statement covering the case that the student is from an existing class, DONE but requires testing
                - Run extensive testing on this if statement/function, it is the crux of importing data*/
            //FIXME: Optimize/Clean this up, it is visually unappealing, extract into its own method/function
            //This method, despite being mildly unattractive, correctly creates a new RegisteringClass
            let foundClass = registeringClasses.find(e => e.school.name === value.school && (e.school.teacher.lastName === value.teachersname.split(' ')[1] && e.school.teacher.firstName === value.teachersname.split(' ')[0]));
            if (!foundClass) {
                registeringClasses = [...registeringClasses, {
                    "id": uniqid(),
                    "school": {
                        "id": schools.find(e => e.name === value.school).id,
                        "name": value.school,
                    },
                    "teacher": {
                        "_id": false,
                        "firstName": value.teachersname.split(' ')[0],
                        "LastName": value.teachersname.split(' ')[1],
                    },
                    "students": [{
                        "id": uniqid(),
                        "firstName": value.firstname,
                        "lastName": value.lastname,
                        "preferredSubjects": preferences
                    }],
                    "sessions": []
                }]
            } else {
                foundClass.students = [...foundClass.students, {
                    "id": uniqid(),
                    "firstName": value.firstname,
                    "lastName": value.lastname,
                    "preferredSubjects": preferences
                }]
            }
        }
        // if (req.query.name || (req.body && req.body.name)) {
        //     context.res = {
        //         // status: 200, /* Defaults to 200 */
        //         body: "Hello " + (req.query.name || req.body.name)
        //     };
        // }
        // else {
        //     context.res = {
        //         status: 400,
        //         body: "Please pass a name on the query string or in the request body"
        //     };
        // }
        // client.connect(function(err) {
        //     context.log("Connected successfully to server");
        //     client.close();
        // });

        //Close the mongoose connection after we are done
        rows.forEach(cleaner)

        
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: {
                    message: "Import from Google Sheet Successful",
                    careerDay: newCareerDay,
                    registeringClasses: registeringClasses,
                    schools: schools
            },
            headers: {
                'Content-Type': 'application/json'
            }
        };

        context.log("-------------------------------- \n [ CareerDay ] \n")
        context.log(newCareerDay)
        context.log("-------------------------------- \n [ Schools ] \n")
        context.log(schools)
        context.log("-------------------------------- \n [ Registering Classes ] \n")
        context.log(registeringClasses)
        //mongoose.connection.close() 

    }else{
        context.res= {
            // status: 200, /* Defaults to 200 */
            status: 400,
            body: {
                    message: "Import unsuccessful. Please double check the link you put in. If the link appears correct, please check the documentation."
                },
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }
    context.done()
};
