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
        agent.add(`I am testimage`);
        agent.add(`I'm sorry, can you try again?`);
        var entry = {  name: agent.parameters.name,
            email:agent.parameters.email,
            date :agent.parameters.date,
            time:agent.parameters.time,
            location: agent.parameters.location,
            duration:agent.parameters.duration,
            event:agent.parameters.event 
        }        

       createappt(entry);
       agent.add('Done! '+ entry.name +' , I have recorded that you have a ' + entry.event + ' on ' + entry.date.split('T')[0] + ' at ' + entry.time.split('T')[1].split('+')[0] + ' for '+ entry.duration.amount + entry.duration.unit +' under '+ entry.email +'.');
    }

    function getAppointment(agent) {
        var email = agent.parameters.email;
    //app.intent('GetAppt', (conv,{email}) =>{    
        return getQueries(email,agent).then((output)=>{
            agent.add(output);
            agent.add(new Card({
                title: str,
            }));
            return console.log('GetAppt executed');
        }) ;
    };

    
    



    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('CreateAppointment', createAppointment);
    intentMap.set('GetAppt', getAppointment);
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


function createappt(entry){
    var email = entry.email;
    var event = entry.event;
    var doc = db.collection('appointment').doc(email).collection('event')
    .add(entry).then(ref => {
        console.log('Added');
    });

}



function getQueries (email,agent) {
    return new Promise((resolve, reject) => {
        var eventRef = db.collection('appointment').doc(email).collection('event');
        var os = require('os');
        eventRef.get().then(snapshot => {
            var str = "";
            var count = 0;
            /*if(snapshot.size > 0){
                str = "You have " + snapshot.size + " events. ";
            }
            else{
                str = "You do not have any appointment";
            }*/
            snapshot.forEach(doc => {
                var cardstr = "";
                var dt = new Date(doc.data().date);
                var time =new Date(doc.data().time);
                var tm = doc.data().time;
                if(dt > Date.now()){
                    //console.log('Found doc with id:', doc.id);
                    count++;
                    //str += 'Found doc with id:' + doc.id;
                   
                    str += os.EOL ;
                    str += "Event " +count + ", " + dt.toDateString();
                    cardstr += "Event " +count + ", " + dt.toDateString();
                    //str += " at " + tm;
                    str += " at " + tm.split('T')[1].split('+')[0] + "."+os.EOL+"\n\
                    ";
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
//exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);