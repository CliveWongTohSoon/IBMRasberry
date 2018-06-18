# Getting Started
## Overview
This is a project done by penultimate year students from Imperial College London in collaboration with IBM to build a turn-based spaceship game that runs by voice commands. The followings are used to develop the game:

1. MEAN Application that runs on IBM cloud, read [here](https://github.com/kuzhankuixiong/IBMSocialGame/blob/master/README.md) to learn more about how to implement the MEAN Application on IBM Cloud.

2. Raspberry Pi 3 B+ that runs on Raspbian Stretch OS. Node.js is used to run IBM Watson Services, such as Speech to Text, Text to Speech, Watson Assistant, and is connected to MongoDB and MEAN Application on IBM Cloud. Node.js is also used to communicate with the General-purpose Input/Output (GPIO) on the Raspberry Pi. 

3. PulseAudio is manually updated to version 11.1 (by default is version 10.0) so that it supports Bluetooth input and output from the Bluetooth earpods. 

This repository will guide you on how to configure the Raspberry Pi such that it is able to invoke Watson services, takes in input and output via Bluetooth earpods, and connects to MongoDB for database management. 

# Tutorial
The following tutorials are especially helpful to learn how to invoke IBM Watson Services using Node.js. Part 1 guides you on how to use Watson services on Node.js on your PC/Mac, whereas Part 2 guides you through how to make minor adjustments to the code such that it can be used on the Raspberry Pi:

**Part 1**: https://medium.com/ibm-watson-developer-cloud/build-a-chatbot-that-cares-part-1-d1c273e17a63#.r9g1q6e4l
**Part 2**: https://medium.com/ibm-watson-developer-cloud/build-a-chatbot-that-cares-part-2-66367cf26e4b#.5j6t75sr4

After following Part 2 of the tutorial mentioned above, additional configurations need be made so that the Raspberry Pi supports bluetooth input and output via PulseAudio 11.0.

## Connect Raspberry Pi to Bluetooth Earpods
The Raspbian Stretch OS running on the Raspberry Pi (at the time of working on this project) does not natively support HSP, which means it can only output sound, but unable to input sound via the mic of the bluetooth earpods. Using USB connected mic as sound input is not ideal for this project because the spaceship has moving parts. The wire attached to the spaceship will hinder its movement. This [tutorial](http://youness.net/raspberry-pi/how-to-connect-bluetooth-headset-or-speaker-to-raspberry-pi-3) provides helpful insights of workaround (sort-of). To summarise the tutorial:

**Step 1:** Start Bluetoothctl tool and initiate it, in terminal:
```
$ bluetoothctl
power on
agent on
default-agent
scan on
```

**Step 2:** After some time, you will see your bluetooth headset name and MAC address (xx:xx:xx:xx:xx:xx). Note down your bluetooth headset MAC address. Afterwards, key in "exit" to exit bluetoothctl, and kill Bluealsa, then start PulseAudio:
```
exit
$ sudo killall bluealsa
$ pulseaudio --start
```

**Step 3:** Go back to Bluetoothctl, Pair, trust and connect your device:
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

**Step 5:** Switch your bluetooth earpods to HSP Profile. Note that you can hit "Tab" to auto fill in the xx_xx (your MAC address). Otherwise, you can use pacmd list-cards to check the name of your connected bluetooth device.
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

**Step 7:** The PulseAudio 11.1 is not yet available for Raspbian Stretch, but it can be compiled from source:
```
$ git clone git://anongit.freedesktop.org/pulseaudio/pulseaudio
$ cd pulseaudio
$ sudo apt-get build-dep pulseaudio
$ ./bootstrap.sh
$ make
$ sudo make install
$ sudo ldconfig
```

Now if you reboot, and repeat Step 2 to 5, or you can write them into a script, you will notice the sounds become drastically better. 

## Obtain IP Address of the Raspberry Pi via email
https://gist.github.com/johnantoni/8199088

# Issues
# Walkarounds
