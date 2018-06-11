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
// Front speaker not working

var Gpio = require('pigpio').Gpio;
var speaker_longitudinal = new Gpio(18, {mode: Gpio.OUTPUT});
var speaker_lateral = new Gpio(19, {mode: Gpio.OUTPUT});
var motor_step = new gpio(20, 'out');
var motor_direction = new gpio(21, 'out');
var motor_sleep = new gpio(22, 'out');
var dutyCycle = 0;

function test(){
    // speaker_longitudinal.pwmFrequency(1000);
    speaker_lateral.pwmFrequency(1000);
    // speaker_longitudinal.pwmWrite(128);
    speaker_lateral.pwmWrite(128);
    pause(150);
    speaker_longitudinal.pwmWrite(0);
    speaker_lateral.pwmWrite(0);
    pause(750);
    // setTimeout(() => { // wait
    //     speaker_longitudinal.pwmWrite(0);
    //     speaker_lateral.pwmWrite(0);
    // }, 150);
}

exports.test = test;

function test_motor(){
    motor_sleep.writeSync(1);
    motor_direction.writeSync(1);
    motor_step.pwmFrequency(1000);
    motor_step.pwmWrite(128);
    pause(5000);
    while(true){

    }
    // motor_step.pwmWrite(0);
}
// test_motor();

function pause(milliseconds) {
	var dt = new Date();
	while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
}

exports.pause = pause;
// for(j = 0; j<5;j++){
//     console.log("beep")
//     test();
// }

function turnMotor(direction) {
    console.log('Entered turn motor');
    if(direction == "right"){
        motor_sleep.writeSync(1);
        motor_direction.writeSync(0); // direction right
        for(i = 0; i<100; i++) { // Take 100 steps (90 degrees)
            motor_step.writeSync(1);
            pause(5);
            motor_step.writeSync(0);  
            pause(5);
        }
        pause(1500);
        motor_sleep.writeSync(0);
        console.log("turn right");
    }
    if(direction == "left"){
        motor_sleep.writeSync(1);
        motor_direction.writeSync(1); // direction left
        for(i = 0; i<100;i++){ // Take 100 steps (90 degrees)
            motor_step.writeSync(1);
            pause(5);
            motor_step.writeSync(0);  
            pause(5);
        }
        pause(1500);
        motor_sleep.writeSync(0);
        console.log("turn left");
    }
}

exports.turnMotor = turnMotor;

//turnMotor("right");

function testSpeaker() {
  console.log("Entered testSpeaker");
  select_lateral_0.writeSync(0); // This is L/R selector
  select_lateral_1.writeSync(0);
  select_lateral_2.writeSync(0);

  select_longitudinal_0.writeSync(0); // F/B selector
  select_longitudinal_1.writeSync(0);
  select_longitudinal_2.writeSync(0);

  // soundSpeakers(distance[0], "right", "");
  frequency = 4000;
  speaker_longitudinal.pwmFrequency(frequency);
  speaker_lateral.pwmFrequency(frequency);
//   speaker_lateral.pwmWrite(128);
  speaker_longitudinal.pwmWrite(128);
  // setTimeout(() => { // wait
  //     speaker_lateral.pwmWrite(0);
  // }, 250);
  pause(250);
//   speaker_lateral.pwmWrite(0);
  speaker_longitudinal.pwmWrite(0);
}

exports.testSpeaker = testSpeaker;

function updateSpeakers(distance, angle){ // distance and angle are two arrays of ships within radar distance and includes (relevent polar coordinate)
    console.log('Entered update speakers');
    for(i = 0; i < distance.length; i++) {
        if(angle[i] === 90) {
            select_lateral_0.writeSync(0);
            select_lateral_1.writeSync(0);
            select_lateral_2.writeSync(1);
            soundSpeakers(distance[i], "right", "");
        } else if(angle[i] === 270){
            select_lateral_0.writeSync(0);
            select_lateral_1.writeSync(0);
            select_lateral_2.writeSync(0);
            soundSpeakers(distance[i], "left", "");
        } else if(angle[i] === 0){
            select_longitudinal_0.writeSync(0);
            select_longitudinal_1.writeSync(0);
            select_longitudinal_2.writeSync(0);
            soundSpeakers(distance[i], "front", "");
        } else if (angle[i] === 180){
            select_longitudinal_0.writeSync(0);
            select_longitudinal_1.writeSync(0);
            select_longitudinal_2.writeSync(1);
            soundSpeakers(distance[i], "back", "");
        } else if(angle[i]>0 && angle[i]<45){ // 75% front 25% right
            select_longitudinal_0.writeSync(1);
            select_longitudinal_1.writeSync(0);
            select_longitudinal_2.writeSync(0);
            select_lateral_0.writeSync(1);
            select_lateral_1.writeSync(1);
            select_lateral_2.writeSync(1);
            soundSpeakers(distance[i], "front", "right");
        } else if( angle[i]==45 ){ // 50% front 50% right
            select_longitudinal_0.writeSync(0);
            select_longitudinal_1.writeSync(1);
            select_longitudinal_2.writeSync(0);
            select_lateral_0.writeSync(0);
            select_lateral_1.writeSync(1);
            select_lateral_2.writeSync(1);
            soundSpeakers(distance[i], "front", "right");
        }  else if( angle[i]>45 && angle[i]<90 ){ // 25% front 75% right
            select_longitudinal_0.writeSync(1);
            select_longitudinal_1.writeSync(1);
            select_longitudinal_2.writeSync(0);
            select_lateral_0.writeSync(1);
            select_lateral_1.writeSync(0);
            select_lateral_2.writeSync(1);
            soundSpeakers(distance[i], "front", "right");
        } else if (angle[i] > 315 && angle[i] < 360 ){ // 75% front 25% left
            select_longitudinal_0.writeSync(1);
            select_longitudinal_1.writeSync(0);
            select_longitudinal_2.writeSync(0);
            select_lateral_0.writeSync(1);
            select_lateral_1.writeSync(1);
            select_lateral_2.writeSync(0);
            soundSpeakers(distance[i], "front", "left");
        } else if(angle[i] === 315  ) { // 50% front 50% left
            select_longitudinal_0.writeSync(0);
            select_longitudinal_1.writeSync(1);
            select_longitudinal_2.writeSync(0);
            select_lateral_0.writeSync(0);
            select_lateral_1.writeSync(1);
            select_lateral_2.writeSync(0);
            soundSpeakers(distance[i], "front", "left");
        } else if( angle[i] > 315 && angle[i] < 360){  // 25% front 75% left
            select_longitudinal_0.writeSync(1);
            select_longitudinal_1.writeSync(1);
            select_longitudinal_2.writeSync(0);
            select_lateral_0.writeSync(1);
            select_lateral_1.writeSync(0);
            select_lateral_2.writeSync(0);
            soundSpeakers(distance[i], "front", "left");
        } else if (angle[i] > 135 && angle[i] < 180 ){ // 75% back 25% right
            select_longitudinal_0.writeSync(1);
            select_longitudinal_1.writeSync(0);
            select_longitudinal_2.writeSync(1);
            select_lateral_0.writeSync(1);
            select_lateral_1.writeSync(1);
            select_lateral_2.writeSync(1);
            soundSpeakers(distance[i], "back", "right");
        }else if (angle[i] == 135  ){ // 50% back 50% right
            select_longitudinal_0.writeSync(0);
            select_longitudinal_1.writeSync(1);
            select_longitudinal_2.writeSync(1);
            select_lateral_0.writeSync(0);
            select_lateral_1.writeSync(1);
            select_lateral_2.writeSync(1);
            soundSpeakers(distance[i], "back", "right");
        } else if (angle[i] > 135 && angle[i] < 180 ){ // 25% back 75% right
            select_longitudinal_0.writeSync(1);
            select_longitudinal_1.writeSync(1);
            select_longitudinal_2.writeSync(1);
            select_lateral_0.writeSync(1);
            select_lateral_1.writeSync(0);
            select_lateral_2.writeSync(1);
            soundSpeakers(distance[i], "back", "right");
        } else if (angle[i] > 180 && angle[i] < 225 ){ // 75% back 25% left
            select_longitudinal_0.writeSync(1);
            select_longitudinal_1.writeSync(0);
            select_longitudinal_2.writeSync(1);
            select_lateral_0.writeSync(1);
            select_lateral_1.writeSync(1);
            select_lateral_2.writeSync(0);
            soundSpeakers(distance[i], "back", "left");
        } else if (angle[i] == 180  ){// 50% back 50% left
            select_longitudinal_0.writeSync(0);
            select_longitudinal_1.writeSync(1);
            select_longitudinal_2.writeSync(1);
            select_lateral_0.writeSync(0);
            select_lateral_1.writeSync(1);
            select_lateral_2.writeSync(0);
            soundSpeakers(distance[i], "back", "left");
        } else if (angle[i] > 225 && angle[i] < 270 ){ // 25% back 75% left
            select_longitudinal_0.writeSync(1);
            select_longitudinal_1.writeSync(1);
            select_longitudinal_2.writeSync(1);
            select_lateral_0.writeSync(1);
            select_lateral_1.writeSync(0);
            select_lateral_2.writeSync(0);
            soundSpeakers(distance[i], "back", "left");
        }
        pause(1000);
    }
}

exports.updateSpeakers = updateSpeakers;

// speaker_lateral.pwmFrequency(1000);
//     speaker_longitudinal.pwmWrite(128);
//     speaker_lateral.pwmWrite(128);
//     pause(150);
//     speaker_longitudinal.pwmWrite(0);

function soundSpeakers(distance, speaker0, speaker1){
    
    if(distance < 2){
        frequency = 8000;
    } else if(distance < 3){
        frequency = 4000;
    } else if(distance < 4){
        frequency = 2000;
    } else if(distance < 6.5){
        frequency = 1600;
    } else {
        frequency = 1000;
    }
    speaker_longitudinal.pwmFrequency(frequency);
    speaker_lateral.pwmFrequency(frequency);

    if(speaker1 == ""){
        if(speaker0 = "front"){
            speaker_longitudinal.pwmWrite(128);
            pause(250);
            speaker_longitudinal.pwmWrite(0);
        }
        if(speaker0 == "back"){
            speaker_longitudinal.pwmWrite(128);
            pause(250);
            speaker_longitudinal.pwmWrite(0);
        }
        if(speaker0 == "left"){
            speaker_lateral.pwmWrite(128);
            pause(250);
            speaker_lateral.pwmWrite(0);
        }
        if(speaker0 == "right"){
            speaker_lateral.pwmWrite(128);
            pause(250);
            speaker_lateral.pwmWrite(0);            
        }
    } else{
        if(speaker0 == "front" && speaker1 == "right"){
            speaker_longitudinal.pwmWrite(128);
            speaker_lateral.pwmWrite(128);
            pause(250);
            speaker_longitudinal.pwmWrite(0);
            speaker_lateral.pwmWrite(0);
        }
        if(speaker0 == "front" && speaker1 == "left"){
            speaker_longitudinal.pwmWrite(128);
            speaker_lateral.pwmWrite(128);
            pause(250);
            speaker_longitudinal.pwmWrite(0);
            speaker_lateral.pwmWrite(0);
        }
        if(speaker0 == "back" && speaker1 == "right"){
            speaker_longitudinal.pwmWrite(128);
            speaker_lateral.pwmWrite(128);
            pause(250);
            speaker_longitudinal.pwmWrite(0);
            speaker_lateral.pwmWrite(0);
        }
        if(speaker0 == "back" && speaker1 == "left"){
            speaker_longitudinal.pwmWrite(128);
            speaker_lateral.pwmWrite(128);
            pause(250);
            speaker_longitudinal.pwmWrite(0);
            speaker_lateral.pwmWrite(0);
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