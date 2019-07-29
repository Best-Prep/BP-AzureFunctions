var Classes = require("./Classes.js");
// importing Map and Set
var Map = require("collections/map");
var Set = require("collections/set");

/* 
    Legend:
        - rc = Registering Classroom Index
*/
module.exports = async function (context, req) {
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
                let teacher = registeringClasses[rc].teacher.firstName + " " +
                    registeringClasses[rc].teacher.lastName;
                let numPeriods = careerDay.numPeriods;
                let preferences = student.preferredSubjects.map(pref => pref.name);
                studentsArray.push(new Classes.Student(name, id, teacher, numPeriods, preferences));
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
            let result = classroom.matchingAlgorithm();
            let count = 0;
            while (!result) {
                classroom.resetAssignments();
                classroom.matchingAlgorithm;
                count++;
                if (count > 100) {
                    break;
                }
            }

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
        
        context.log("[CareerDay]")
        context.log(careerDay)
        context.log("[registeringClasses]")
        context.log(registeringClasses[0].students[0])
        context.log("[schools]     " + schools)
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: {
                message: "Career Day successfully saved to CosmosDB",
                careerDay: careerDay,
                registeringClasses: registeringClasses,
                schools: schools
            }
        };
    } else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
    context.done()
};
