'use strict';

//const functions = require('firebase-functions');
//const {webhookClient,  Button, Suggestion } = require('dialogflow-fulfillment');
//const {dialogflow,BasicCard,} = require('actions-on-google');
//const requestLib = require('request');


const express = require('express');
const bodyParser = require('body-parser');
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');


var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://calendarbot2-e0f84.firebaseio.com"
});

const {
    dialogflow,
    Image,
    Table,
    Carousel,
} = require('actions-on-google');
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

const app = dialogflow();

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const db = admin.firestore();

const timeZone = 'Asia/HongKong';
const timeZoneOffset = '+08:00';


app.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function createAppointment(agent) {
        //agent.add(`I am testimage`);
        //agent.add(`I'm sorry, can you try again?`);
        var entry = {
            name: agent.parameters.name,
            email: agent.parameters.email,
            date: agent.parameters.date,
            time: agent.parameters.time,
            location: agent.parameters.location,
            duration: agent.parameters.duration,
            event: agent.parameters.event
        }

        createappt(entry);
        agent.add('Done! ' + entry.name + ' , I have recorded that you have a ' + entry.event + ' on ' + entry.date.split('T')[0] + ' at ' + entry.time.split('T')[1].split('+')[0] + ' for ' + entry.duration.amount + entry.duration.unit + ' under ' + entry.email + '.');
    }

    function getAppointment(agent) {
        var email = agent.parameters.email;
        //app.intent('GetAppt', (conv,{email}) =>{    
        return getQueries(email, agent).then((output) => {
            //agent.add(output);
                        return console.log('GetAppt executed');
        });
    };

    function cancelAppointment(agent) {
        var email = agent.parameters.email;
        //app.intent('CancelAppt', (conv,{email}) =>{
        return getQueries(email, agent).then((output) => {
            agent.add(" Which appointments do you wish to cancel?");
            return console.log("CancelAppointmentIntent executed");
        });
    };

    function cancelSelectedAppointment(agent) {
        var email = agent.parameters.email;
        var number = agent.parameters.number;
        //app.intent('CancelSelectedAppt', (conv,{email,number}) =>{
        return deleteAppt(email, number, agent).then((output) => {
            //conv.ask("Cancellation Done");
            return console.log("CancelSelectedApptIntent executed");
        });
    };

    function updateAppointment(agent) {
        var email = agent.parameters.email;
        //app.intent('UpdateAppt', (conv,{email}) =>{
        return getQueries(email, agent).then((output) => {
            agent.add( " Which appointments do you wish to update?");
            return console.log("UpdateAppointmentIntent executed");
        })
    };

    function updateSelectedAppointment(agent) {
        var email = agent.parameters.email;
        var number = agent.parameters.number;
        //app.intent('UpdateSelectedAppt', (conv,{email,number}) =>{
        return updateEvent(email, number, agent).then((output) => {
            return console.log("UpdatedSelectedAppt Excuted ");
        });
    };


    function updateParameter(agent) {
        var email = agent.parameters.email;
        var number = agent.parameters.number;
        var param = agent.parameters.param;
        var date = agent.parameters.date;
        var time = agent.parameters.time;
        var location = agent.parameters.location;
        var duration = agent.parameters.duration;
        //app.intent('UpdateParameter', (conv, { email, number, param, date, time, location, duration }) => {
        return updateParam(email, number, param, date, time, location, duration, agent).then((output) => {

            return console.log("CancelSelectedApptIntent executed");
        })
    };



    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('CreateAppointment', createAppointment);
    intentMap.set('GetAppt', getAppointment);
    intentMap.set('CancelAppt', cancelAppointment);
    intentMap.set('UpdateAppt', updateAppointment);
    intentMap.set('UpdateSelectedAppt', updateSelectedAppointment);
    intentMap.set('UpdateParameter', updateParameter);
    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
});

const expressApp = express().use(bodyParser.json());

expressApp.post('/fulfillment', app.dialogflowFirebaseFulfillment);
//expressApp.listen(3000);
var listener = expressApp.listen(process.env.PORT, process.env.IP, function () {
    //var listener = expressApp.listen(4000, process.env.IP, function () {
    console.log("server started");
    console.log("listening on port " +
        listener.address().port);
});

//********************************************************************************************** */

function createappt(entry) {
    var email = entry.email;
    var event = entry.event;
    var doc = db.collection('appointment').doc(email).collection('event')
        .add(entry).then(ref => {
            console.log('Added');
        });

}



function getQueries(email, agent) {
    return new Promise((resolve, reject) => {
        var eventRef = db.collection('appointment').doc(email).collection('event');
        var os = require('os');
        eventRef.get().then(snapshot => {
            var str = "";
            var count = 0;
            if(snapshot.size > 0){
                str = "You have " + snapshot.size + " events. ";
            }
            else{
                str = "You do not have any appointment";
            }

            //snapshot.data().sort(function (a, b) { return b.date - a.date });

            snapshot.forEach(doc => {
                var cardstr = "";
                var dt = new Date(doc.data().date);
                var time = new Date(doc.data().time);
                var tm = doc.data().time;
                if (dt > Date.now()) {
                    //console.log('Found doc with id:', doc.id);
                    count++;
                    //str += 'Found doc with id:' + doc.id;

                    str += os.EOL;
                    str += "Event " + count + ", " + dt.toDateString();
                    cardstr += "Event " + count + ", " + dt.toDateString();
                    //str += " at " + tm;
                    str += " at " + tm.split('T')[1].split('+')[0] + "." + os.EOL + "\t\n";
                    cardstr += " at " + tm.split('T')[1].split('+')[0] + ".";
                    //time.split('T')[1].split('+')[0]
                    //str += "at " + time.toTimeString().slice(1,time.toTimeString().indexOf("GMT+")) + "."; 
                }

                agent.add(new Card({
                    title: cardstr,
                }));
            });

            //conv.add(str);
            resolve(str);
        });
        /*.catch(err => {
            console.log('Error getting documents', err);
            conv.add("Error getting event");
            reject("test");
        });*/
    });
}

function deleteAppt(email, number, agent) {
    return new Promise((resolve, reject) => {
        var eventRef = db.collection('appointment').doc(email).collection('event');
        eventRef.get().then(snapshot => {
            var str = "";
            var id = "";
            var count = 0;
            //Get booking reference
            snapshot.forEach(doc => {
                var dt = new Date(doc.data().date);
                var time = doc.data().time;
                if (dt > Date.now()) {
                    count++;
                    if (count == number) {
                        console.log('DEL:Found doc with id:', doc.id);
                        str += count + ". Your booking on " + dt.toDateString();
                                         
                        str += " at " + time.split('T')[1].split('+')[0] + " is cancelled.";
                        //Delete doc here
                        var deleteDoc = eventRef.doc(doc.id).delete();
                        console.log('DEL:', deleteDoc);
                    }
                }
            });
            agent.add(str);
            resolve("Cancellation Resolved");
        })
            .catch(err => {
                console.log('Error getting documents', err);
                agent.add("Error Cancelling");
                reject("Cencellation Rejected");
            });
    });
}

function updateEvent(email, number, conv) {
    return new Promise((resolve, reject) => {
        var eventRef = db.collection('appointment').doc(email).collection('event');
        eventRef.get().then(snapshot => {
            var str = "";
            var id = "";
            var count = 0;
            //Get booking reference
            snapshot.forEach(doc => {
                var dt = new Date(doc.data().date);
                var time = doc.data().time;
                var dur = doc.data().duration;
                var loc = doc.data().location;

                if (dt > Date.now()) {
                    count++;
                    if (count == number) {
                        console.log('DEL:Found doc with id:', doc.id);
                        //str += count + ". Your booking on " + dt.toDateString();
                        //str += "at " + time.toTimeString().slice(1,time.toTimeString().indexOf("GMT+")) + " is cancelled.";
                        //str += "Event " + count + ". Your apointment date : " + dt.toDateString();
                        conv.add(new Card({  title:  "Event " + count + ". Your apointment" ,}));
                        conv.add(new Card({  title:  "date " + dt.toDateString()  ,}));
                        conv.add(new Card({  title:  "time: " + time.split('T')[1].split('+')[0]  ,}));
                        conv.add(new Card({  title:  "duration: " + dur['amount'] + dur['unit']  ,}));
                        //str += "\n  time: " + time.split('T')[1].split('+')[0];
                        //str += "\n   duration: " + dur['amount'] + dur['unit'];
                        //str += "\n    location: " + dur['amount'];
                        str += "\n    Which parameter and value do you want to update ? ";
                        //Delete doc here
                        //var deleteDoc = eventRef.doc(doc.id).delete();
                        console.log('DEL:');
                    }
                }

            });
            conv.add(str);
            resolve("Update Resolved");
        })
            .catch(err => {
                console.log('Error getting documents', err);
                conv.add("Error Cancelling");
                reject("Update Rejected");
            });
    });
}


function updateParam(email, number, param, date, time, location, duration, conv) {
    return new Promise((resolve, reject) => {
        var eventRef = db.collection('appointment').doc(email).collection('event');
        eventRef.get().then(snapshot => {
            var str = "";
            var id = "";
            var count = 0;
            //Get booking reference
            snapshot.forEach(doc => {
                var dt = doc.data().date;
                //var dt = new Date(doc.data().date);
                var tm = doc.data().time;
                var dur = doc.data().duration;
                var loc = doc.data().location;
                //childSnap.val()['food']
                //if(Date(dt) > Date.now()){
                count++;
                if (count == number) {
                    if (date != "") { dt = date }
                    if (time != "") { tm = time }
                    if (duration != "") { dur = duration }
                    console.log('DEL:Found doc with id:', doc.id);
                    // str += count + ". Your booking on " + dt.toDateString();
                    //str += "at " + time.toTimeString().slice(1,time.toTimeString().indexOf("GMT+")) + " is cancelled.";
                    //str += "Event "+ count + " updated . Your apointment now is date : " + dt.toDateString();
                    str += "Event " + count + " updated . Your apointment is now date : " + dt.split('T')[0];
                    str += "\r\n  time: " + tm.split('T')[1].split('+')[0];
                    //.toTimeString().split('GMT')[0];
                    //.split('T')[1].split('+')[0];
                    //str += "\r\n  time: " + tm.toTimeString().slice(1,tm.toTimeString().indexOf("GMT+"));
                    str += "\r\n   duration: " + dur['amount'] + dur['unit'];
                    var updateDoc = eventRef.doc(doc.id).update({ date: dt, time: tm, duration: dur });
                    console.log('Up:');
                }
                //}

            });
            conv.add(str);
            resolve("Cancellation Resolved");
        })
            .catch(err => {
                console.log('Error getting documents', err);
                conv.add("Error Cancelling");
                reject("Cencellation Rejected");
            });
    });
}
//exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);