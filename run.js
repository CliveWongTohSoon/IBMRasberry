const WatsonSpeechToText = require('watson-developer-cloud/speech-to-text/v1');
const WatsonToneAnalyzer = require('watson-developer-cloud/tone-analyzer/v3');
const WatsonConversation = require('watson-developer-cloud/conversation/v1');
const WatsonTextToSpeech = require('watson-developer-cloud/text-to-speech/v1');
const config = require('./config.js');
const attentionWord = config.attentionWord;

const fs = require('fs');
const mic = require('mic');
const exec = require('child_process').exec;
const probe = require('node-ffprobe');
const express = require('express'); 
const http = require('http');
const socketIO = require('socket.io-client');

const gameFn = require('./game');
const mongoose = require('mongoose');

const gpioFn = require('./gpio');
const Instruction = require('./models/instruction');
const Start = require('./models/start');

/******************************************************************************
 * Report
 ******************************************************************************/
const report = [
  "Nothing happened",             // code 0 
  "Ship turning left",            // code 1
  "Ship turning right",           // code 2
  "Attacked successfully",        // code 3
  "Attack missed",                // code 4
  "We've been attacked",          // code 5
  "Shield has been activated",    // code 6
  "Shield has been hit",          // code 7
  "We collided with another ship" // code 8
];

/******************************************************************************
 * Initialise Ship Id
 ******************************************************************************/
const shipUid = 'TestShipA';

/******************************************************************************
 * Set up Socket
 ******************************************************************************/
const socket = socketIO("https://ibmsg2018.eu-gb.mybluemix.net");

/******************************************************************************
 * Create MongoDB instance
 ******************************************************************************/

const uri = "mongodb://new-user:IBMSG2018@ibmsocialgame-shard-00-00-zpkv9.mongodb.net:27017,ibmsocialgame-shard-00-01-zpkv9.mongodb.net:27017,ibmsocialgame-shard-00-02-zpkv9.mongodb.net:27017/test?ssl=true&replicaSet=IBMSocialGame-shard-0&authSource=admin&retryWrites=true";
mongoose.connect(uri);
// Instruction.find({}, console.log);
/******************************************************************************
* Create Watson Services
*******************************************************************************/
const speechToText = new WatsonSpeechToText({
  username: config.STTUsername,
  password: config.STTPassword,
  version: 'v1'
});

const toneAnalyzer = new WatsonToneAnalyzer({
  username: config.ToneUsername,
  password: config.TonePassword,
  version: 'v3',
  version_date: '2016-05-19'
});

const conversation = new WatsonConversation({
  username: config.ConUsername,
  password: config.ConPassword,
  version: 'v1',
  version_date: '2016-07-11'
});

const textToSpeech = new WatsonTextToSpeech({
  username: config.TTSUsername,
  password: config.TTSPassword,
  version: 'v1'
});

/******************************************************************************
* Configuring the Microphone
*******************************************************************************/
const micParams = { 
  rate: 44100, 
  channels: 2, 
  debug: false,
  exitOnSilence: 20
};

const micInstance = mic(micParams);
const micInputStream = micInstance.getAudioStream();

let pauseDuration = 0;
micInputStream.on('pauseComplete', ()=> {
  // console.log('Microphone paused for', pauseDuration, 'seconds.');
  setTimeout(() => {
      micInstance.resume();
      console.log('Microphone resumed.')
  }, Math.round(pauseDuration * 1000)); //Stop listening when speaker is talking
});

micInstance.start();
console.log('TJ is listening, you may speak now.');

/******************************************************************************
* Speech To Text
*******************************************************************************/
const sttParams = {
  model: "en-US_NarrowbandModel",
  content_type: "audio/l16; rate=44100; channels=2",
  interim_results: true,
  smart_formatting: true,
  max_alternatives: 5,
  keywords: [attentionWord, "move forward"],
  timestamps: true,
  inactivity_timeout: -1,
  word_confidence: true,
  speaker_labels: true,
  keywords_threshold: 0.5
  // model: "en-US_NarrowbandModel",
  // content_type: "audio/l16; rate=44100; channels=2",
  // interim_results: true,
  // smart_formatting: true,
  // keywords: [attentionWord, "move", "fire", "shield", "left", "right", "forward", "front", "back"],
  // keywords_threshold: 0.5,
  // inactivity_timeout: -1,
  // timestamps: true,
  // max_alternatives: 5,
  // word_alternatives_threshold: 0.7,
  // word_confidence: true,
  // speaker_labels: true
};

const textStream = micInputStream.pipe(
  speechToText.createRecognizeStream(sttParams)
).setEncoding('utf8');

/******************************************************************************
* Get Emotional Tone
*******************************************************************************/
const getEmotion = (text) => {
  return new Promise((resolve) => {
    let maxScore = 0;
    let emotion = null;
    toneAnalyzer.tone({text: text}, (err, tone) => {
      let tones = tone.document_tone.tone_categories[0].tones;
      for (let i=0; i<tones.length; i++) {
        if (tones[i].score > maxScore) {
          maxScore = tones[i].score;
          emotion = tones[i].tone_id;
        }
      }
      resolve({emotion, maxScore});
    })
  })
};

/******************************************************************************
* Text To Speech
*******************************************************************************/
const speakResponse = (text) => {
  const params = {
    text: text,
    voice: config.voice,
    accept: 'audio/wav'
  };

  textToSpeech.synthesize(params)
  .pipe(fs.createWriteStream('output.wav'))
  .on('close', () => {
    probe('output.wav', function(err, probeData) {
      pauseDuration = probeData ? probeData.format.duration + 0.2 : 10;
      micInstance.pause();
      exec('paplay output.wav', (error, stdout, stderr) => {
        if (error !== null) {
          console.log('exec error: ' + error);
        }
      });
      // player.play('output.wav');
    });
  });
};

exports.speakResponse = speakResponse;

/*****************************************************************************
 * Function to map instruction
 *****************************************************************************/

 // TODO:- Check the intent
function getInstruction(intent, entity) {
  if (intent === 'goforward') return 'MoveFront';
  else if (intent === 'rotate' && entity === 'left') return 'LeftTurn';
  else if (intent === 'rotate' && entity === 'right') return 'RightTurn';
  else if (intent === 'attack') return 'ShootFront';
  else if (intent === 'defence' && entity === 'front') return 'FrontShield';
  else if (intent === 'defence' && entity === 'rear') return 'BackShield';
  else if (intent === 'defence' && entity === 'right') return 'RightShield';
  else if (intent === 'defence' && entity === 'left') return 'LeftShield'; 
  else if (intent === 'donothing') return 'DoNothing';
  else return 'tryagain';
}

/******************************************************************************
* Conversation
******************************************************************************/
let start_dialog = false;
let context = {};
let watson_response = '';
let intentArray = [];

socket.on("connect", () => {
  console.log("Socket connected!");
  
  // Join the socket
  socket.emit('join', {shipId: shipUid});

  // Initialise the gpio
  socket.on('start', shipData => {
    // console.log('Current ship data: ', shipData);
  });

  // Introduction
  speakResponse('Hi captain, on your command');

  // Listen to instruction socket
  socket.on('instruction', instructionData => {
    // textStream.emit('data');
    if (instructionData.phase === 'action') { 
      // Listen to instruction textstream
      textStream.on('data', (user_speech_text) => { // TODO:- How to end the textstream?
        // user_speech_text = user_speech_text.toLowerCase();
        console.log('Watson hears: ', user_speech_text);

        getEmotion(user_speech_text).then((detectedEmotion) => {
          context.emotion = detectedEmotion.emotion;
          conversation.message({
            workspace_id: config.ConWorkspace,
            input: { 'text': user_speech_text },
            context: context
          }, (err, response) => {
            context = response.context;
            const intent = response.intents[0].intent;
            const entity = response.entities[0] && response.entities[0].entity;

            // Change to checking intent and entity
            const instructionToPush = getInstruction(intent, entity);
            if (intent !== 'hello' && instructionToPush !== 'tryagain') intentArray.push(instructionToPush);

            watson_response = response.output.text[0];
            if (intentArray.length < 3) {
              speakResponse(watson_response);
              // console.log('Watson says: ', watson_response);  
              console.log('Intent length: ', intentArray);
              // speakResponse('What\'s next, captain?');
            } else if (intentArray.length === 3) {

              Instruction.findOne({ shipId: shipUid }, (err, instruction) => {
                if (err) throw err;
                instruction.instruction0 = intentArray[0];
                instruction.instruction1 = intentArray[1];
                instruction.instruction2 = intentArray[2];
                // instruction.phase = 'action';

                // Save to database
                instruction.save(err, _ => {
                  if (!err) {
                    // Emit to socket
                    console.log("Emit to socket instruction_client!");
                    socket.emit('instruction_client', {shipId: shipUid}); 
                    textStream.emit('close');
                  }
                });

                console.log('Calling instruction!', intentArray);
                intentArray = [];
              });
            }
          });
        });
      })
      .on('close', () => {
        console.log('textstream closed');
      });
    } else { // if instruction given is in report phase
      console.log('Report phase: ', instructionData);

      micInstance.pause();
      setTimeout(() => { }, 15000);

      // Report the ship status after each instruction, 1 report to each instruction
      const reportId0 = instructionData.report0;
      const reportId1 = instructionData.report1;
      const reportId2 = instructionData.report2;

      // At the end of instruction, update the ship LED and Speakers

      // Speak response
      speakResponse(report[reportId0] + '. ' + report[reportId1] + '. ' + report[reportId1]);

      // After finished reporting, emit to instruction socket, set the phase to action
      socket.emit('instruction', {phase: 'action'});
    }
  });
});