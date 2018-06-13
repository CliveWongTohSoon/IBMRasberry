const WatsonSpeechToText = require("watson-developer-cloud/speech-to-text/v1");
const WatsonToneAnalyzer = require("watson-developer-cloud/tone-analyzer/v3");
const WatsonConversation = require("watson-developer-cloud/conversation/v1");
const WatsonTextToSpeech = require("watson-developer-cloud/text-to-speech/v1");
const config = require("./config.js");
const attentionWord = config.attentionWord;

const fs = require("fs");
const mic = require("mic");
const exec = require("child_process").exec;
const probe = require("node-ffprobe");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io-client");

const gameFn = require("./game");
const mongoose = require("mongoose");

const gpioFn = require("./gpio");
const Instruction = require("./models/instruction");
const Start = require("./models/start");

/******************************************************************************
 * Report
 ******************************************************************************/
const report = [
  "Unknown entities detected within radar range",    // code 0
  "Attacked the enemy successfully",                                           // code 1
  "Our left weapons have missed",                                              // code 2
  "Our weapons have hit enemy shields",                                        // code 3
  "We're under attack from an enemy",                                          // code 4
  "Shields have been damaged by an enemy",                                     // code 5
  "We have collided with an enemy ship",                                       // code 6
  "We've collided with an asteroid",                                           // code 7
  "Our right weapons have missed"                                              // code 8
];

/******************************************************************************
 * Initialise Ship Id
 ******************************************************************************/
const shipUid = "TestShipA";

/******************************************************************************
 * Set up Socket
 ******************************************************************************/
const socket = socketIO("https://ibmsg2018.eu-gb.mybluemix.net");

/******************************************************************************
 * Create MongoDB instance
 ******************************************************************************/

const uri =
  "mongodb://new-user:IBMSG2018@ibmsocialgame-shard-00-00-zpkv9.mongodb.net:27017,ibmsocialgame-shard-00-01-zpkv9.mongodb.net:27017,ibmsocialgame-shard-00-02-zpkv9.mongodb.net:27017/test?ssl=true&replicaSet=IBMSocialGame-shard-0&authSource=admin&retryWrites=true";
mongoose.connect(uri);

/******************************************************************************
 * Create Watson Services
 *******************************************************************************/
const speechToText = new WatsonSpeechToText({
  username: config.STTUsername,
  password: config.STTPassword,
  version: "v1"
});

const toneAnalyzer = new WatsonToneAnalyzer({
  username: config.ToneUsername,
  password: config.TonePassword,
  version: "v3",
  version_date: "2016-05-19"
});

const conversation = new WatsonConversation({
  username: config.ConUsername,
  password: config.ConPassword,
  version: "v1",
  version_date: "2016-07-11"
});

const textToSpeech = new WatsonTextToSpeech({
  username: config.TTSUsername,
  password: config.TTSPassword,
  version: "v1"
});

/******************************************************************************
 * Configuring the Microphone
 *******************************************************************************/
const micParams = {
  rate: 8000,
  channels: 1,
  debug: false,
  exitOnSilence: 10
};

const micInstance = mic(micParams);
const micInputStream = micInstance.getAudioStream();

let pauseDuration = 0;

micInputStream.on("pauseComplete", () => {
  console.log("Microphone paused for ", pauseDuration, "seconds.");
  setTimeout(function() {
    // gpioFn.pause(pauseDuration * 1000);
    micInstance.resume();
    textStream.resume();
    // textStream.emit('data', 'Waiting...');
  }, Math.round(pauseDuration * 1000)); //Stop listening when speaker is talking
});

micInputStream.on("resumeComplete", () => {
  console.log("Microphone resumed.");
  // textStream.resume();
});

micInputStream.on("processExitComplete", function() {
  console.log("Got SIGNAL processExitComplete");
});

micInstance.start();
console.log("TJ is listening, you may speak now.");

/******************************************************************************
 * Speech To Text
 *******************************************************************************/
const sttParams = {
  model: "en-US_NarrowbandModel",
  content_type: "audio/l16; rate=8000; channels=1",
  interim_results: true,
  smart_formatting: true,
  max_alternatives: 3,
  keywords: [
    attentionWord,
    "move",
    "fire",
    "shield",
    "left",
    "right",
    "forward",
    "front",
    "back"
  ],
  timestamps: true,
  inactivity_timeout: -1,
  word_confidence: false,
  speaker_labels: false,
  keywords_threshold: 0.5
};

const textStream = speechToText.createRecognizeStream(sttParams);

micInputStream.pipe(textStream);

textStream.setEncoding("utf8");

/******************************************************************************
 * Get Emotional Tone
 *******************************************************************************/
const getEmotion = text => {
  return new Promise(resolve => {
    let maxScore = 0;
    let emotion = null;
    toneAnalyzer.tone({ text: text }, (err, tone) => {
      let tones = tone.document_tone.tone_categories[0].tones;
      for (let i = 0; i < tones.length; i++) {
        if (tones[i].score > maxScore) {
          maxScore = tones[i].score;
          emotion = tones[i].tone_id;
        }
      }
      resolve({ emotion, maxScore });
    });
  });
};

/******************************************************************************
 * Text To Speech
 *******************************************************************************/
const speakResponse = text => {
  const params = {
    text: text,
    voice: config.voice,
    accept: "audio/wav"
  };

  textToSpeech
    .synthesize(params)
    .pipe(fs.createWriteStream("output.wav"))
    .once("close", () => {
      probe("output.wav", function(err, probeData) {
        pauseDuration = probeData ? probeData.format.duration + 0.2 : 5;

        micInstance.pause();
        textStream.uncork();
        textStream.unpipe();

        // // Pause the textStream so it won't overwrites the current speech
        textStream.pause();

        exec("paplay output.wav", (error, stdout, stderr) => {
          if (error !== null) {
            console.log("exec error: " + error);
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
  if (intent === "goforward") return "MoveFront";
  else if (intent === "rotate" && entity === "left") return "LeftTurn";
  else if (intent === "rotate" && entity === "right") return "RightTurn";
  else if (intent === "attack") return "ShootFront";
  else if (intent === "defence" && entity === "front") return "FrontShield";
  else if (intent === "defence" && entity === "rear") return "BackShield";
  else if (intent === "defence" && entity === "right") return "RightShield";
  else if (intent === "defence" && entity === "left") return "LeftShield";
  else if (intent === "donothing") return "DoNothing";
  else return "tryagain";
}

/******************************************************************************
 * Conversation
 ******************************************************************************/
let intentArray = [];
let isPaused = false;
let timer = 0;

/*****************************************************************************
 * Emit socket
 *****************************************************************************/
const emitToSocket = () => {
  if (!isPaused) {
    // Save to database
    Instruction.findOne({ shipId: shipUid }, (err, instruction) => {
      if (err) throw err;
      instruction.instruction0 = intentArray[0] ? intentArray[0] : 'DoNothing';
      instruction.instruction1 = intentArray[1] ? intentArray[1] : 'DoNothing';
      instruction.instruction2 = intentArray[2] ? intentArray[3] : 'DoNothing';

      // Save to database
      instruction.save(err, _ => {
        if (!err) {
          // Emit to socket
          console.log("Emit to socket instruction_server!");
          socket.emit("instruction_server", { shipId: shipUid });
          // textStream.emit('close');
        }
      });

      console.log("Calling instruction!", intentArray);
      intentArray = [];
    });
    isPaused = true;
  }
};

/***************************************************************************
 * Play sound track
 ***************************************************************************/
const playSound = (filename) => {
  probe("/home/pi/Desktop/tjbot-raspberrypi-nodejs/sounds/" + filename, function (err, probeData) {
    const pauseForSoundEffect = probeData.format.duration + 0.2;
    micInstance.pause();
    textStream.uncork();
    textStream.unpipe();

    // Pause the textStream so it won't overwrites the current speech
    textStream.pause();

    exec("paplay /home/pi/Desktop/tjbot-raspberrypi-nodejs/sounds/" + filename, (error, stdout, stderr) => {
      if (error !== null) {
        console.log("exec error: " + error);
      }
    });

    setTimeout(() => {
      textStream.resume();
    }, pauseForSoundEffect * 1000);
  });
};

/**************************************************************************
 * Listening to socket
 **************************************************************************/
socket.on("connect", () => {
  console.log("Socket connected!");

  // Join the socket
  socket.emit("join", { shipId: shipUid });

  // Initialise the gpio
  socket.on("start_client", shipData => {
    // console.log('Current ship data: ', shipData);
    const myShip = shipData;
    const opponentDistance = myShip.opponentDistance;
    const opponentAngle = myShip.opponentAngle;
    console.log(myShip.shipId, opponentDistance, opponentAngle);

    const totalHp = shipData.totalHp;
    const reHealth = shipData.reHealth;
    const reHealthPercentage = (reHealth * 100) / totalHp;
    const leHealth = shipData.leHealth;
    const leHealthPercentage = (leHealth * 100) / totalHp;
    const rwHealth = shipData.rwHealth;
    const rwHealthPercentage = (rwHealth * 100) / totalHp;
    const lwHealth = shipData.lwHealth;
    const lwHealthPercentage = (lwHealth * 100) / totalHp;

    // Update health point
    // weapon_left_hp_percentage, weapon_right_hp_percentage, engine_left_hp_percentage, engine_right_hp_percentage
    gpioFn.updateLED(
      lwHealthPercentage,
      rwHealthPercentage,
      leHealthPercentage,
      reHealthPercentage
    );

    // Update speaker
    for (let i = 0; i < 5; i++) {
      gpioFn.updateSpeakers(opponentDistance, opponentAngle);
      gpioFn.pause(300);
    }
  });

  // Introduction
  speakResponse("Hi captain, on your command");

  // Timer
  setInterval(() => {
    timer++;
    console.log(timer);
    if (timer > 60) {
      emitToSocket();
    }
    textStream.emit('data', 'Waiting...');
  }, 1000);

  // Listen to instruction socket
  socket.on("instruction", instructionData => {
    // textStream.emit('data');
    if (instructionData.phase === "action") {
      console.log('Action phase');
      // Listen to instruction textstream
      textStream
        .on("data", user_speech_text => {
          console.log("Watson hears: ", user_speech_text);
          
          console.log("Time left:", 60 - timer);
        
          if (user_speech_text !== 'Waiting...') { // If it's not waiting, send to watson assistant
            conversation.message(
              {
                workspace_id: config.ConWorkspace,
                input: { text: user_speech_text }
              },
              (err, response) => {
                // console.log(response);
                context = response.context;
                const intent = response.intents[0].intent;
                const entity =
                  response.entities[0] && response.entities[0].entity;

                // Change to checking intent and entity
                const instructionToPush = getInstruction(intent, entity);

                // Only speak when Watson understands
                if (
                  intent !== "hello" &&
                  instructionToPush !== "tryagain" &&
                  intentArray.length < 3
                ) {
                  // Push intent
                  intentArray.push(instructionToPush);
                  const watson_response = response.output.text[0];

                  console.log("Intent: ", intentArray);

                  // Play sound effect
                  if (intent === 'attack') playSound('shoot.wav');
                  else if (intent === 'defence') playSound('shield.wav');
                  else if (intent === "goforward") playSound("move.wav");

                  // Turn motor
                  if (instructionToPush == 'LeftTurn') {
                    gpioFn.turnMotor('left');
                  } else if (instructionToPush == 'RightTurn') {
                    gpioFn.turnMotor('right');
                  }

                  // Respond
                  speakResponse(watson_response);

                } else if (intent === "hello") { // If hello intent is detected
                  textStream.pause();
                  speakResponse(response.output.text[0]);

                } else if (intentArray.length === 3) {
                  console.log('Full intent: ', intentArray);
                  // Save to database
                  emitToSocket();
                }
              }
            );
          }
        })
        .on("close", () => {
          console.log("textstream closed");
        });
    } else {
      // if instruction given is in report phase
      console.log("Report phase: ", instructionData);

      micInstance.pause();
      // setTimeout(() => { }, 15000);

      // Report the ship status after each instruction, 1 report to each instruction
      const reportSpeech = instructionData.report.reduce((prev, cur) => {
        prev += report[cur] + ". ";
        return prev;
      }, "");

      console.log("Report Speech:", reportSpeech);
      // Speak response
      speakResponse(reportSpeech);

      // Reset timer
      isPaused = false;
      timer = 0;

      // After finished reporting, emit to instruction socket, set the phase to action
      textStream.emit('data', 'Waiting...');
      socket.emit("instruction", { phase: "action" });
    }
  });
});