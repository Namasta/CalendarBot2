'use strict';

//const functions = require('firebase-functions');
//const {webhookClient,  Button, Suggestion } = require('dialogflow-fulfillment');
const {dialogflow,BasicCard,} = require('actions-on-google');
const requestLib = require('request');


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

const app = dialogflow();

//admin.initializeApp();
const db = admin.firestore();

const timeZone = 'Asia/HongKong';
const timeZoneOffset = '+08:00';

const expressApp = express().use(bodyParser.json());

expressApp.post('/fulfillment', app.dialogflowFirebaseFulfillment);
//expressApp.listen(3000);
//var listener = expressApp.listen(process.env.PORT, process.env.IP, function () {
    var listener = app.listen(4000, process.env.IP, function () {
    console.log("server started");
    console.log("listening on port " +
      listener.address().port);
  });


//exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);