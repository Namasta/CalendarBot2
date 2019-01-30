'use strict';


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

const db = admin.firestore();

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
        var entry = {   name: name,
            email:agent.parameters.email,
            date :agent.parameters.date,
            time:agent.parameters.time,
            location: agent.parameters.location,
            duration:agent.parameters.duration,
            event:agent.parameters.event};            

       // createappt(conv,entry);
       agent.add('Done! '+ name +' , I have recorded that you have a ' + event + ' on ' + date.split('T')[0] + ' at ' + time.split('T')[1].split('+')[0] + ' for '+ duration[0] + ' under '+ email +'.');
    }



    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('CreateAppointment', createAppointment);
    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
});



const expressApp = express().use(bodyParser.json());

expressApp.post('/fulfillment', app.dialogflowFirebaseFulfillment);
//expressApp.listen(3000);
var listener = expressApp.listen(process.env.PORT, process.env.IP, function () {
    //var listener = app.listen(4000, process.env.IP, function () {
    console.log("server started");
    console.log("listening on port " +
      listener.address().port);
  });

  /*app.intent('CreateAppointment',(conv,{name,email,date,time,location,duration, event})=>{
    var entry = {   name: name,
                    email:email,
                    date :date,
                    time:time,
                    location: location,
                    duration:duration,
                    event:event};
                    
    
     createappt(conv,entry);
     conv.ask('Done! '+ name +' , I have recorded that you have a ' + event + ' on ' + date.split('T')[0] + ' at ' + time.split('T')[1].split('+')[0] + ' for '+ duration[0] + ' under '+ email +'.');
     //conv.ask('Done! '+ name +' , I have recorded that you have a ' + Startdate + ' on ' + Starttime + ' at ' + time + ' for ' + duration + ' under '+ email +'.');

    
});*/