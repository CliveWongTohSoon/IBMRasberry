const Instruction = require('./models/instruction');
const textToSpeech = require('watson-developer-cloud/text-to-speech/v1');
const watson = require('./run');

function move() {
    console.log("Moving...");
    const instruction = new Instruction({
        // shipId: { type: Schema.Types.ObjectId },
        // phase: { type: String, required: true },
        // instruction0: { type: String, required: true },
        // instruction1: { type: String, required: true },
        // instruction2: { type: String, required: true },
    });

    instruction.save((err, result) => {
        if (err) {
            watson.speakResponse('An error occured!');
        } else {
            watson.speakResponse('Roger that!');
        }
    });
}

exports.move = move;