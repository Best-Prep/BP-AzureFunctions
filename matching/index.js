var Classes = require("./Classes.js");
// importing Map and Set
var Map = require("collections/map");
var Set = require("collections/set");


module.exports = async function (context, req) {

    context.log('JavaScript HTTP trigger function processed a request.');

    // Type: [{}] : See School model
    let schools = req.body.schools

    // Type: {} : See CareerDay model
    let careerDay = req.body.careerDay

    // Type: [{}] : See RegisteringClassroom Model
    let registeringClasses = req.body.registeringClasses

    // iterate through the classrooms, running the matching algorithm on each
    for (let i = 0; i < registeringClasses.length; i++) {

        // create the Student objects
        let studentArray = [];
        for (let j = 0; j < registeringClasses[i].students.length; j++) {
            let name = registeringClasses[i].students[j].firstName + " " + registeringClasses[i].students[j].lastName;
            let id = registeringClasses[i].students[j].id;
            let teacher = registeringClasses[i].teacher.id;
            let preferences = [];
            for (let k = 0; k < registeringClasses[i].students[i].preferredSubjects.length; k++) {
                preferences.push(registeringClasses[i].students[j].preferredSubjects[k]);
            }
            let numPeriods = int (careerDay.numPeriods);
            let newStudent = new Classes.Student(name, id, teacher, numPeriods, preferences);
            studentArray.push(newStudent);
        }

        // create the Session objects
        let sessionArray = [];
        for (let j = 0; j < registeringClasses[i].sessions.length; j++) {
            let period = int (registeringClasses[i].sessions[j].period);
            let subject = resgisteringClasses[i].sessions[j].name;
            let capacity = int (registeringClasses[i].sessions[j].seats);
            let teacher = registeringClasses[i].sessions[j].id;
            let newSession = new Classes.Session(period, subject, capacity, teacher);
            sessionArray.push(newSession);
        }

        // create the Classroom object and run the matching algorithm 
        let classroom = new Classes.Classroom(registeringClasses[i].id, studentArray, sessionArray);
        classroom.matchingAlgorithm();

        // check if it's a valid matching; if not, run algorithm again until it works or times out
        let limit = 0;
        while(!classroom.isValidMatching() && limit < 1000) {
            classroom.resetAssignments();
            classroom.matchingAlgorithm();
            limit++;
        }
        if (limit >= 1000) {
            //data error: there is some kind of error with the info fed into the algorithm
        }

        // update JSON objects (classroom level and careerDay level)
        let updatedSessions = classroom.getSessions().values();
        let sess = updatedSessions.next();
        while (!sess.done) {
            for (let j = 0; j < registeringClasses[i].sessions.length; j++) {
                if (sess.getTeacher() == registeringClasses[i].sessions[j].id) {
                    let studs = classroom.getStudents().values();
                    let stud = studs.next();
                    while (!stud.done) {
                        let first = stud.getName().split(" ")[0];
                        let last = stud.getName().split(" ")[1];
                        registeringClasses[i].sessions[j].assignedStudents.push(JSON.stringify({id: stud.getId(), firstName: first, lastName: last}));
                        for (let k = 0; k < careerDay.sessions.length; k++) {
                            if (sess.getId() == careerDay.sessions[k].id) {
                                careerDay.sessions[k].assignedStudents.push(JSON.stringify({id: stud.getId(), firstName: first, lastName: last}));
                            }
                        } 
                        for (let k = 0; k < registeringClasses[i].students.length; k++) {
                            if (stud.getId() == regsiteringClasses[i].students[i].id) {
                                registeringClasses[i].students[i].schedule[sess.getPeriod()] = (JSON.stringify({id: sess.getTeacher(), name: sess.getSubject()}));
                            }
                        }
                    }
                }
            }
        }
    }

    // Response
    if (req.query.name || (req.body && req.body.name)) {
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: "Hello " + (req.query.name || req.body.name)
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
};
