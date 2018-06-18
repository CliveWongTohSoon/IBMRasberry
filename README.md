# Getting Started
## Overview
This is a project done by penultimate year students from Imperial College London in collaboration with IBM to build a turn-based spaceship game that runs by voice commands. The followings are used to develop the game:

1. MEAN Application that runs on IBM cloud, read [here](https://github.com/kuzhankuixiong/IBMSocialGame/blob/master/README.md) to learn more about how to implement the MEAN Application on IBM Cloud.

2. Raspberry Pi 3 B+ that runs on Raspbian Stretch OS. Node.js is used to run IBM Watson Services, such as Speech to Text, Text to Speech, Watson Assistant, and is connected to MongoDB and MEAN Application on IBM Cloud. Node.js is also used to communicate with the General-purpose Input/Output (GPIO) on the Raspberry Pi. 

3. PulseAudio is manually updated to version 11.0 (by default is version 10.0) so that it supports Bluetooth input and output from the Bluetooth earpods. 

This repository will guide you on how to configure the Raspberry Pi such that it is able to invoke Watson services, takes in input and output via Bluetooth earpods, and connects to MongoDB for database management. 

# Tutorial
The following tutorials are especially helpful to learn how to invoke IBM Watson Services using Node.js. Part 1 guides you on how to use Watson services on Node.js on your PC/Mac, whereas Part 2 guides you through how to convert the code to be used on Raspberry Pi:

**Part 1**: https://medium.com/ibm-watson-developer-cloud/build-a-chatbot-that-cares-part-1-d1c273e17a63#.r9g1q6e4l
**Part 2**: https://medium.com/ibm-watson-developer-cloud/build-a-chatbot-that-cares-part-2-66367cf26e4b#.5j6t75sr4


# Issues
# Walkarounds
