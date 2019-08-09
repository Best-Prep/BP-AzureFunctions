var Classes = require("./Classes.js");
// importing Map and Set
var Map = require("collections/map");
var Set = require("collections/set");
var mongoose = require('mongoose');

/* 
    Legend:
        - rc = Registering Classroom Index
*/
const mongooseClassroom = require('../models/classroomModel')
const mongooseCareerDay = require('../models/careerDayModel')

module.exports = async function (context, req) {
    let result = true;
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
    context.log("Function executed once")
    // Response
    if (req.body && req.body.schools && req.body.careerDay && req.body.registeringClasses) {
        context.log('JavaScript HTTP trigger function processed a request.');

        // // Type: [{}] : See School model
        let schools = req.body.schools
        // context.log("[SCHOOLS] --------------------")
        // context.log(schools)
        // // Type: {} : See CareerDay model
        let careerDay = req.body.careerDay
        // context.log("[CAREERDAY] --------------------")
        // context.log(careerDay)
        // // Type: [{}] : See RegisteringClassroom Model
        let registeringClasses = [...req.body.registeringClasses]
        // context.log("[REGISTERINGCLASSES] --------------------")
        // context.log(registeringClasses)

        for(let rc = 0; rc<registeringClasses.length; rc++){

            // initialize student object array for classroom constructor
            let studentsArray = [];

            // initialize session object array for classroom constructor
            let sessionsArray = [];
            // iterate through students of registering class JSON
            for (let s = 0; s < registeringClasses[rc].students.length; s++) {
                let student = registeringClasses[rc].students[s];
                let name = student.firstName + " " + student.lastName;
                let id = student.id;
                let teacher = registeringClasses[rc].teacher.firstName + registeringClasses[rc].teacher.lastName; //This is actually the school name
                let school = registeringClasses[rc].school.name;
                let numPeriods = careerDay.numPeriods;
                let preferences = student.preferredSubjects.map(pref => pref.name);
                studentsArray.push(new Classes.Student(name, id, teacher, school, numPeriods, preferences));
            }

            // iterate thorugh sessions of registering class JSON
            for (let s = 0; s < registeringClasses[rc].sessions.length; s++) {
                let session = registeringClasses[rc].sessions[s];
                let period = session.period;
                let subject = session.name;
                let capacity = session.seats;
                let teacher = session.id;
                sessionsArray.push(new Classes.Session(period, subject, capacity, teacher));
            }

            let classroom = new Classes.Classroom(registeringClasses[rc].id, studentsArray, sessionsArray);
            result = classroom.matchingAlgorithm();
            let count = 0;
            while (!result) {
                classroom.resetAssignments();
                classroom.matchingAlgorithm();
                count++;
                if (count > 100) {
                    break;
                }
            }
            if (result === false){
                context.res = {
                    // status: 200, /* Defaults to 200 */
                    status: 412,
                    body: {
                        message: "Matching algorithm failed. Please double check the seat assignments you provided."
                    }
                };
            }else{

                // TODO: if result is still false, that means a valid matching is not possible
                // so we need to send an error
    
                context.log(classroom.isValidMatching());
                
                let sess = classroom.getSessions().values();
                let ses = sess.next();
                while (!ses.done) {
                    let sesVal = ses.value;
                    let members = ses.value.getStudents();
                    let studs = members.values();
                    let stud = studs.next();
                    while (!stud.done) {
                        let studVal = stud.value;
                        let studObject = classroom.getStudents().get(studVal);
                        let curr = 0;
                        while (curr < registeringClasses[rc].sessions.length) {
                            if (sesVal.getTeacher() === registeringClasses[rc].sessions[curr].id) {
                                let addStud = {
                                    "id": studObject.getId(),
                                    "teacher": studObject.getTeacher(),
                                    "school": studObject.getSchool(),
                                    "firstName": studObject.getName().split(" ")[0],
                                    "lastName": studObject.getName().split(" ")[1]
                                }
                                registeringClasses[rc].sessions[curr].assignedStudents.push(addStud);
                                careerDay.sessions[curr].assignedStudents.push(addStud);
                            }
                            curr++;
                        }
                        let cur = 0;
                        while (cur < registeringClasses[rc].students.length) {
                            if (studObject.getId() === registeringClasses[rc].students[cur].id) {
                                context.log(registeringClasses[rc].students[cur].schedule)
                                context.log(sesVal.getPeriod())
                                registeringClasses[rc].students[cur].schedule[sesVal.getPeriod()] = {
                                    "id": sesVal.getTeacher(),
                                    "name": sesVal.getSubject()
                                }
                            }
                            cur++;
                        }
                        stud = studs.next();
                    }
                    ses = sess.next();
                }            
            }
        }
        if(result === true){
            mongooseCareerDay.collection.insert(careerDay, function (err, doc) {
                if (err){ 
                    context.log(err);
                } else {
                  context.log("CareerDay document inserted to Collection");
                }
              }
            )
    
            mongooseClassroom.collection.insert(registeringClasses, function (err, docs) {
                if (err){ 
                    context.log(err);
                } else {
                    context.log("Multiple RegisteringClass documents inserted to Collection");
                }
              }
            )
    
            context.res = {
                // status: 200, /* Defaults to 200 */
                body: {
                    message: "Career Day successfully saved to CosmosDB",
                    careerDay: careerDay,
                    registeringClasses: registeringClasses,
                    schools: schools
                }
            };
        }
    } else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
    context.done()
};
