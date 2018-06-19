# Getting Started
* [Overview](#overview)
* [Tutorial](#tutorial)
  * [Connect Raspberry Pi to Bluetooth Headsets](#connect-raspberry-pi-to-bluetooth-headsets)
  * [Connect to Raspberry Pi via SSH](#connect-to-raspberry-pi-via-ssh)
  * [Obtain IP Address of the Raspberry Pi via email](#obtain-ip-address-of-the-raspberry-pi-via-email)
  * [How to use the code](#how-to-use-the-code)
* [Issues](#issues)
* [Suggestions](#suggestions)

## Overview
This is a project done by penultimate year students from Imperial College London in collaboration with IBM to build a turn-based spaceship game that runs by voice commands. The followings are used to develop the game:

1. MEAN Application that runs on IBM cloud, read [here](https://github.com/CliveWongTohSoon/IBMSocialGame.git) to learn more about how to implement the MEAN Application on IBM Cloud.

2. Raspberry Pi 3 B+ that runs on Raspbian Stretch OS. Node.js is used to run IBM Watson Services, such as Speech to Text, Text to Speech, Watson Assistant, and is connected to MongoDB and MEAN Application on IBM Cloud. Node.js is also used to communicate with the General-purpose Input/Output (GPIO) on the Raspberry Pi. 

3. PulseAudio is manually updated to version 11.1 (by default is version 10.0) so that it supports Bluetooth input and output from the Bluetooth earpods. 

This repository will guide you on how to configure the Raspberry Pi such that it is able to invoke Watson services, takes in input and output via Bluetooth earpods, and connects to MongoDB for database management. 

# Tutorial
The following tutorials are especially helpful to learn how to invoke IBM Watson Services using Node.js. Part 1 guides you on how to use Watson services on Node.js on your PC/Mac, whereas Part 2 guides you through how to make minor adjustments to the code such that it can be used on the Raspberry Pi:

**Part 1**: https://medium.com/ibm-watson-developer-cloud/build-a-chatbot-that-cares-part-1-d1c273e17a63#.r9g1q6e4l
**Part 2**: https://medium.com/ibm-watson-developer-cloud/build-a-chatbot-that-cares-part-2-66367cf26e4b#.5j6t75sr4

After following Part 2 of the tutorial mentioned above, additional configurations need be made so that the Raspberry Pi supports bluetooth input and output via PulseAudio 11.0.

## Connect Raspberry Pi to Bluetooth Headsets
The Raspbian Stretch OS running on the Raspberry Pi (at the time of working on this project) does not natively support HSP, which means it can only output sound, but unable to input sound via the mic of the bluetooth earpods. Using USB connected mic as sound input is not ideal for this project because the spaceship has moving parts; the wire attached to the spaceship will hinder its movement. This [tutorial](http://youness.net/raspberry-pi/how-to-connect-bluetooth-headset-or-speaker-to-raspberry-pi-3) provides helpful insights of workaround (sort-of). To summarise the tutorial:

**Step 1:** Start bluetoothctl tool and initiate it, in terminal:
```
$ bluetoothctl
power on
agent on
default-agent
scan on
```

**Step 2:** After some time, you will see your bluetooth headset name and MAC address (xx:xx:xx:xx:xx:xx). Note down your bluetooth headset MAC address. Afterwards, exit bluetoothctl, kill Bluealsa, then start PulseAudio:
```
exit
$ sudo killall bluealsa
$ pulseaudio --start
```

**Step 3:** Go back to bluetoothctl, pair, trust and connect your device:
```
$ bluetoothctl
pair xx:xx:xx:xx:xx:xx
trust xx:xx:xx:xx:xx:xx
connect xx:xx:xx:xx:xx:xx
```
**Step 4:** If you try to switch to headset_head_unit profile and use parecord to record your voice, it will not work. This is due to an incorrect audio routing of SCO. To correct that, use this command:
```
$ sudo hcitool cmd 0x3F 0x01C 0x01 0x02 0x00 0x01 0x01
```

**Step 5:** Switch your bluetooth earpods to HSP Profile. Note that you can hit "Tab" to auto complete your bluez_card.xx_xx_xx_xx_xx_xx (your MAC address). Otherwise, you can use "pacmd list-cards" to check the name of your connected bluetooth device.
```
$ pacmd set-card-profile bluez_card.xx_xx_xx_xx_xx_xx headset_head_unit
$ pacmd set-default-sink bluez_sink.xx_xx_xx_xx_xx_xx.headset_head_unit
$ pacmd set-default-source bluez_source.xx_xx_xx_xx_xx_xx.headset_head_unit
```

Try to record your voice with the command: 
```
$ parecord -v /tmp/voice.wav
```
and play it back:
```
paplay -v /tmp/voice.wav
```

You should be able to hear your sound, but the audio quality is miserable. The bad audio quality will not work well with Watson Speech to Text service. The issue is caused by the natively supported PulseAudio (version 10.0) on Raspbian Stretch. To learn more about the issue you can visit the [link here](https://github.com/raspberrypi/linux/issues/2229). Therefore, to fix this issue, we have to manually update PulseAudio to version 11.1.

**Step 6:** Update to PulseAudio 11.1 on Raspbian Stretch. First, set the parameter autodetect_mtu=yes in default.pa:
```
$sudo nano /etc/pulse/default.pa
```
In the file, add in the following:
```
.ifexists module-bluetooth-discover.so
load-module module-bluetooth-discover autodetect_mtu=yes
.endif
```
The PulseAudio 11.1 is not yet available for Raspbian Stretch, but it can be compiled from source:
```
$ git clone git://anongit.freedesktop.org/pulseaudio/pulseaudio
$ cd pulseaudio
$ sudo apt-get build-dep pulseaudio
$ ./bootstrap.sh
$ make
$ sudo make install
$ sudo ldconfig
```

After you reboot, and repeat Step 2 to 5 (which can be written into a script), you will notice the sounds has drastically improved. 

## Connect to Raspberry Pi via SSH 
It might be troublesome to have USB keyboard and mouse connected to your Raspberry Pi everytime you want to have access to it. Therefore, it is more convenient to connect to your Raspberry Pi via SSH from your PC/Mac. Follow the tutorial [here](https://www.raspberrypi.org/documentation/remote-access/ssh/) to set up the Raspberry Pi such that it can be connected via SSH. After it has been set up, you can connect to Raspberry Pi with its IP Address via the command:
```
ssh pi@XXX.XXX.X.X
```

## Obtain IP Address of the Raspberry Pi via email
There are many ways of obtaining IP Address of Raspberry Pi on boot-up, which allows it to be connected by SSH. The most favoured way of achieving it is by sending an email containing the IP Address of the Raspberry Pi whenever it boots up. You may clone the python script from [here](https://gist.github.com/johnantoni/8199088) which allows email to be sent via gmail. You will need to have gmail account set up to run this script. To make the Python Script executes everytime it boots up and connects to the Internet, do the following:

**Step 1:** Create code directory
```
$ mkdir ~/code
```

**Step 2:** Make it executable:
```
cd ~/code
$ sudo chmod +x startup_mailer.py
```
You may check the python script actually works by running the python script:
```
$ python startup_mailer.py
```
If it works, proceed with the next step.

**Step 3:** Create my_script.sh:
```
$ sudo nano my_script.sh
```
and add in the following:
```
#!/bin/bash
python /home/pi/code/startup_mailer.py
```
Afterwards, make the script executable:
```
$ chmod u+x my_script.sh
```

**Step 4:** Create a new service for my_script.sh:
```
$ sudo systemctl edit --force --full my_script.service
```
Insert the following:
```
[Unit]
Description=My Script Service
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/home/pi/my_script.sh

[Install]
WantedBy=multi-user.target
```

**Step 5:** Check the new service:
```
$ systemctl status my_script.service
```
Then, enable and start the service:
```
$ sudo systemctl enable my_script.service
$ sudo systemctl start my_script.service
```

After rebooting, you should receive an email containing the IP Address of your Raspberry Pi. Use SSH to connect to the IP Address to have remote access of your Raspberry Pi. 

## How to use the code
After setting up the Raspberry Pi, your can run the code in this repository with the following steps:
*Reminder: You need to follow the tutorial aforementioned to install Node.js on your Raspberry Pi. Also, make sure you are in the right directory when executing the command.*

**Step 0:** You need to have IBM cloud account. Go to https://www.ibm.com/cloud/ sign up for IBM account, and create IBM Watson Speech Assistant, Speech to Text, Text to Speech services. Also, create a MongoDb account from https://cloud.mongodb.com/. After getting the credentials respectively, include them in **config.template.js**, then change its name to **config.js**. 

**Step 1:** Install the node package required, this will install all packages from package.json: 
```
$ npm install
```

**Step 2:** The mic module used does not work on Raspberry Pi due to the lack to parameter "device" not working. To fix this, go to the directory *node_modules/mic/lib/* and remove parameter device from the audioProcess on line 60:

Change
```
else {
    audioProcess = spawn('arecord', ['-c', channels, '-r', rate, '-f',
                         format, '-D', device], audioProcessOptions);
}
```
to
```
else {
    audioProcess = spawn('arecord', ['-c', channels, '-r', rate, '-f',
                         format], audioProcessOptions);
}                     
```

**Step 3:** Notice that gpioFn.js does not run without root permission, therefore we need to give permission to gpioFn.js the permission: 
```
$ chmod u+x gpioFn.js
```

**Step 4:** Now everything has been set up properly, you can run the code:
```
$ node run.js
```

Note that to enable socketIO, you need to have a web app with socketIO server hosted on the cloud. To learn how to push your web app to IBM cloud, you may follow the tutorial [here](https://console.bluemix.net/docs/starters/upload_app.html). The video [here](https://www.youtube.com/watch?v=zp4EKdDZTiY&t=182s) also provides insight of how to write a manifest.yml file for web app deployment on IBM Cloud. Otherwise, you may visit this [repository](https://github.com/CliveWongTohSoon/IBMSocialGame.git) to learn how to deploy the MEAN Web App on IBM Cloud.  

# Issues
This project is not without issues, which is summarised below:
1. Watson runs relatively accurate in quiet environment, however, its performance will drop drastically in a noisy environment (in terms of response/callback speed and accuracy), i.e there will be noticably inaccurate and slow response for the speech to text conversion. 

2. In the micInputStream is piped into Watson's Speech to Text Service (via variable *speechToText*). When using micInstance.pause(), it stops piping audio stream to the STT service. Nonetheless, the audio stream is still buffered, and when micInstance.resume() is called, the buffered audio stream will continue flow through. This results in the previous sentence still being "listened" by Watson during the pause() period. You may notice sometimes textStream returns your last sentence when it is resumed.To learn more about pipe method, visit [here](https://nodejs.org/api/stream.html) and [here](https://nodejs.org/en/docs/guides/backpressuring-in-streams/).

3. "Waiting" is emitted to textStream every second because the node will be closed after long period of inactivity (i.e no audio stream being recorded). 

# Suggestions
1. To fix issue 1, you may adjust the sampling frequency by varying micParams. This could potentially filters out high frequencies noise. 

2. Optimise the code by closing the pipe instead of pausing it. Afterwards, restart the pipe after the response speech has been played. Note that textStream will be closed if the pipe is closed. You might need to rewrite how textStream retrieves data. 
