var gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED_weapon_left_Red = new gpio(4, 'out'); //use GPIO pin 4, and specify that it is output
var LED_weapon_left_Green = new gpio(5, 'out'); //use GPIO pin 5, and specify that it is output
var LED_weapon_right_Red = new gpio(6, 'out'); //use GPIO pin 6, and specify that it is output
var LED_weapon_right_Green = new gpio(7, 'out'); //use GPIO pin 7, and specify that it is output
var LED_engine_left_Red = new gpio(8, 'out'); //use GPIO pin 8, and specify that it is output
var LED_engine_left_Green = new gpio(9, 'out'); //use GPIO pin 9, and specify that it is output
var LED_engine_right_Red = new gpio(10, 'out'); //use GPIO pin 10, and specify that it is output
var LED_engine_right_Green = new gpio(11, 'out'); //use GPIO pin 11, and specify that it is output
var select_longitudinal_0 = new gpio(12, 'out');
var select_longitudinal_1 = new gpio(13, 'out');
var select_longitudinal_2 = new gpio(14, 'out');
var select_lateral_0 = new gpio(15, 'out');
var select_lateral_1 = new gpio(16, 'out');
var select_lateral_2 = new gpio(17, 'out');

var Gpio = require('pigpio').Gpio;
var speaker_front = new Gpio(18, {mode: Gpio.OUTPUT});
var speaker_back = new Gpio(19, {mode: Gpio.OUTPUT});
var speaker_left = new Gpio(20, {mode: Gpio.OUTPUT});
var speaker_right = new Gpio(21, {mode: Gpio.OUTPUT});
var dutyCycle = 0;

function test(){
    speaker_front.pwmFrequency(1000);
    speaker_right.pwmFrequency(1000);
    speaker_front.pwmWrite(128);
    speaker_right.pwmWrite(128);
    pause(150);
    speaker_front.pwmWrite(0);
    speaker_right.pwmWrite(0);
    pause(750);
    // setTimeout(() => { // wait
    //     speaker_front.pwmWrite(0);
    //     speaker_right.pwmWrite(0);
    // }, 150);
    
}

function pause(milliseconds) {
	var dt = new Date();
	while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
}

// for(j = 0; j<5;j++){
//     console.log("beep")
//     test();
// }


function updateSpeakers(ship){ // ship is an array of ships within radar distance and includes (relevent .distance .x .y)
    for(i = 0; i < ship.length; i++){
        if(ship[i].y == 0){
            if(ship[i].x > 0){
                select_lateral_0.writeSync(0);
                select_lateral_1.writeSync(0);
                select_lateral_2.writeSync(1);
                soundSpeakers(ship[i].distance, "right", "");

            } else {
                select_lateral_0.writeSync(0);
                select_lateral_1.writeSync(0);
                select_lateral_2.writeSync(0);
                soundSpeakers(ship[i].distance, "left", "");

            }
        } else if(ship[i].x == 0){
            if(ship[i].y > 0){
                select_longitudinal_0.writeSync(0);
                select_longitudinal_1.writeSync(0);
                select_longitudinal_2.writeSync(0);
                soundSpeakers(ship[i].distance, "front", "");

            } else {
                select_longitudinal_0.writeSync(0);
                select_longitudinal_1.writeSync(0);
                select_longitudinal_2.writeSync(1);
                soundSpeakers(ship[i].distance, "back", "");
            }

        } else if(ship[i].y >= 0){
            if(ship[i].x >= 0){
                if(abs(ship[i].y/ship[i].x)){ // 75% front 25% right
                    select_longitudinal_0.writeSync(1);
                    select_longitudinal_1.writeSync(0);
                    select_longitudinal_2.writeSync(0);
                    select_lateral_0.writeSync(1);
                    select_lateral_1.writeSync(1);
                    select_lateral_2.writeSync(1);
                    soundSpeakers(ship[i].distance, "front", "right");
                } else if(abs(ship[i].y/ship[i].x)){ // 50% front 50% right
                    select_longitudinal_0.writeSync(0);
                    select_longitudinal_1.writeSync(1);
                    select_longitudinal_2.writeSync(0);
                    select_lateral_0.writeSync(0);
                    select_lateral_1.writeSync(1);
                    select_lateral_2.writeSync(1);
                    soundSpeakers(ship[i].distance, "front", "right");
                } else { // 25% front 75% right
                    select_longitudinal_0.writeSync(1);
                    select_longitudinal_1.writeSync(1);
                    select_longitudinal_2.writeSync(0);
                    select_lateral_0.writeSync(1);
                    select_lateral_1.writeSync(0);
                    select_lateral_2.writeSync(1);
                    soundSpeakers(ship[i].distance, "front", "right");
                }
            }
            if(ship[i].x < 0){
                if(abs(ship[i].y/ship[i].x) > 1.4){ // 75% front 25% left
                    select_longitudinal_0.writeSync(1);
                    select_longitudinal_1.writeSync(0);
                    select_longitudinal_2.writeSync(0);
                    select_lateral_0.writeSync(1);
                    select_lateral_1.writeSync(1);
                    select_lateral_2.writeSync(0);
                    soundSpeakers(ship[i].distance, "front", "left");
                } else if(abs(ship[i].y/ship[i].x) > 0.7){ // 50% front 50% left
                    select_longitudinal_0.writeSync(0);
                    select_longitudinal_1.writeSync(1);
                    select_longitudinal_2.writeSync(0);
                    select_lateral_0.writeSync(0);
                    select_lateral_1.writeSync(1);
                    select_lateral_2.writeSync(0);
                    soundSpeakers(ship[i].distance, "front", "left");
                } else { // 25% front 75% left
                    select_longitudinal_0.writeSync(1);
                    select_longitudinal_1.writeSync(1);
                    select_longitudinal_2.writeSync(0);
                    select_lateral_0.writeSync(1);
                    select_lateral_1.writeSync(0);
                    select_lateral_2.writeSync(0);
                    soundSpeakers(ship[i].distance, "front", "left");
                }
            }

        } else { 
            if(ship[i].x > 0){
                if(abs(ship[i].y/ship[i].x) > 1.4){ // 75% back 25% right
                    select_longitudinal_0.writeSync(1);
                    select_longitudinal_1.writeSync(0);
                    select_longitudinal_2.writeSync(1);
                    select_lateral_0.writeSync(1);
                    select_lateral_1.writeSync(1);
                    select_lateral_2.writeSync(1);
                    soundSpeakers(ship[i].distance, "front", "right");
                } else if(abs(ship[i].y/ship[i].x) > 0.7){ // 50% back 50% right
                    select_longitudinal_0.writeSync(0);
                    select_longitudinal_1.writeSync(1);
                    select_longitudinal_2.writeSync(1);
                    select_lateral_0.writeSync(0);
                    select_lateral_1.writeSync(1);
                    select_lateral_2.writeSync(1);
                    soundSpeakers(ship[i].distance, "front", "right");
                } else { // 25% back 75% right
                    select_longitudinal_0.writeSync(1);
                    select_longitudinal_1.writeSync(1);
                    select_longitudinal_2.writeSync(1);
                    select_lateral_0.writeSync(1);
                    select_lateral_1.writeSync(0);
                    select_lateral_2.writeSync(1);
                    soundSpeakers(ship[i].distance, "front", "right");
                }
            }
            if(ship[i].x < 0){
                if(abs(ship[i].y/ship[i].x) > 1.4){ // 75% back 25% left
                    select_longitudinal_0.writeSync(1);
                    select_longitudinal_1.writeSync(0);
                    select_longitudinal_2.writeSync(1);
                    select_lateral_0.writeSync(1);
                    select_lateral_1.writeSync(1);
                    select_lateral_2.writeSync(0);
                    soundSpeakers(ship[i].distance, "front", "left");
                } else if(abs(ship[i].y/ship[i].x) > 0.7){ // 50% back 50% left
                    select_longitudinal_0.writeSync(0);
                    select_longitudinal_1.writeSync(1);
                    select_longitudinal_2.writeSync(1);
                    select_lateral_0.writeSync(0);
                    select_lateral_1.writeSync(1);
                    select_lateral_2.writeSync(0);
                    soundSpeakers(ship[i].distance, "front", "left");
                } else { // 25% back 75% left
                    select_longitudinal_0.writeSync(1);
                    select_longitudinal_1.writeSync(1);
                    select_longitudinal_2.writeSync(1);
                    select_lateral_0.writeSync(1);
                    select_lateral_1.writeSync(0);
                    select_lateral_2.writeSync(0);
                    soundSpeakers(ship[i].distance, "front", "left");
                }
            }
        }
    }
}

exports.updateSpeakers = updateSpeakers;

function soundSpeakers(distance, speaker0, speaker1){
    dutyCycle = 1 / (10000 - 5000 * distance/8)
    if(speaker1 = ""){
        if(speaker0 = "front"){
            speaker_front.pwmWrite(dutyCycle);
            setTimeout(() => { // wait
                speaker_front.pwmWrite(0);
            }, 250);
            
        }
        if(speaker0 = "back"){
            speaker_back.pwmWrite(dutyCycle);
            setTimeout(() => { // wait
                speaker_back.pwmWrite(0);
            }, 250);
            
        }
        if(speaker0 = "left"){
            speaker_left.pwmWrite(dutyCycle);
            setTimeout(() => { // wait
                speaker_left.pwmWrite(0);
            }, 250);
            
        }
        if(speaker0 = "right"){
            speaker_right.pwmWrite(dutyCycle);
            setTimeout(() => { // wait
                speaker_right.pwmWrite(0);
            }, 250);
            
        }
    } else{
        if(speaker0 == "front" && speaker1 == "right"){
            speaker_front.pwmWrite(dutyCycle);
            speaker_right.pwmWrite(dutyCycle);
            setTimeout(() => { // wait
                speaker_front.pwmWrite(0);
                speaker_right.pwmWrite(0);
            }, 250);
        }
        if(speaker0 == "front" && speaker1 == "left"){
            speaker_front.pwmWrite(dutyCycle);
            speaker_left.pwmWrite(dutyCycle);
            setTimeout(() => { // wait
                speaker_front.pwmWrite(0);
                speaker_left.pwmWrite(0);
            }, 250);
        }
        if(speaker0 == "back" && speaker1 == "right"){
            speaker_back.pwmWrite(dutyCycle);
            speaker_right.pwmWrite(dutyCycle);
            setTimeout(() => { // wait
                speaker_back.pwmWrite(0);
                speaker_right.pwmWrite(0);
            }, 250);
        }
        if(speaker0 == "back" && speaker1 == "left"){
            speaker_back.pwmWrite(dutyCycle);
            speaker_left.pwmWrite(dutyCycle);
            setTimeout(() => { // wait
                speaker_back.pwmWrite(0);
                speaker_left.pwmWrite(0);
            }, 250);
        }
    }
}
exports.soundSpeakers = soundSpeakers;

function updateLED(weapon_left_hp_percentage, weapon_right_hp_percentage, engine_left_hp_percentage, engine_right_hp_percentage) {
    // GPIO, update which pin
    // Weapon Left
    if (weapon_left_hp_percentage >= 70) { // Set LED to Green
        LED_weapon_left_Green.writeSync(1); 
        LED_weapon_left_Red.writeSync(0);
    } else if (weapon_left_hp_percentage >= 30){ // Set LED to Yellow
        LED_weapon_left_Green.writeSync(1); 
        LED_weapon_left_Red.writeSync(1);
    } else if (weapon_left_hp_percentage > 0){ // Set LED to Red
        LED_weapon_left_Green.writeSync(0); 
        LED_weapon_left_Red.writeSync(1);
    } else { // Turn off LED
        LED_weapon_left_Green.writeSync(0); 
        LED_weapon_left_Red.writeSync(0);
    }


    // Weapon Right
    if (weapon_right_hp_percentage >= 70) { // Set LED to Green
        LED_weapon_right_Green.writeSync(1); 
        LED_weapon_right_Red.writeSync(0);
    } else if (weapon_right_hp_percentage >= 30){ // Set LED to Yellow
        LED_weapon_right_Green.writeSync(1); 
        LED_weapon_right_Red.writeSync(1);
    } else if (weapon_right_hp_percentage > 0){ // Set LED to Red
        LED_weapon_right_Green.writeSync(0); 
        LED_weapon_right_Red.writeSync(1);
    } else { // Turn off LED
        LED_weapon_right_Green.writeSync(0); 
        LED_weapon_right_Red.writeSync(0);
    }

    // Engine Left
    if (engine_left_hp_percentage >= 70) { // Set LED to Green
        LED_engine_left_Green.writeSync(1); 
        LED_engine_left_Red.writeSync(0);
    } else if (engine_left_hp_percentage >= 30){ // Set LED to Yellow
        LED_engine_left_Green.writeSync(1); 
        LED_engine_left_Red.writeSync(1);
    } else if (engine_left_hp_percentage > 0){ // Set LED to Red
        LED_engine_left_Green.writeSync(0); 
        LED_engine_left_Red.writeSync(1);
    } else { // Turn off LED
        LED_engine_left_Green.writeSync(0); 
        LED_engine_left_Red.writeSync(0);
    }

    // Engine Right
    if (engine_right_hp_percentage >= 70) { // Set LED to Green
        LED_engine_right_Green.writeSync(1); 
        LED_engine_right_Red.writeSync(0);
    } else if (engine_right_hp_percentage >= 30){ // Set LED to Yellow
        LED_engine_right_Green.writeSync(1); 
        LED_engine_right_Red.writeSync(1);
    } else if (engine_right_hp_percentage > 0){ // Set LED to Red
        LED_engine_right_Green.writeSync(0); 
        LED_engine_right_Red.writeSync(1);
    } else { // Turn off LED
        LED_engine_right_Green.writeSync(0); 
        LED_engine_right_Red.writeSync(0);
    }

} 

exports.updateLED = updateLED;