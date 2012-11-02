#!/usr/bin/env node

/*
 * Beginning a connection:
 *   Send: NICK [yournick]
 *   Send: USER [yournick] 0 * : [yournick]
 * And wait for the response
 *
 * To join a channel:
 *   Send: JOIN [channel_name]
 *
 * To send a msg to a channel:
 *   Send: PRIVMSG [channel_name] message
 *
 * To quit:
 *   Send: QUIT
 *
 * To command bot, send a message in the following format:
 *   {callBotStr} {command} {args}
 *
 *  Ex: bot> hello bot
 *
 * To extend the command list, have a look at the end of this file
 */

var net = require('net');
var format = require('util').format;
var serverAddr =  'irc.freenode.net';
var serverPort = 6667;
var botname = 'kgcdbot';
var channelname = '#kgcd';
var callBotStr = 'bot>'; // Command to wake up the bot
var encoding = 'utf8';

var sendMsg = function (socket,cmd, params) {
    data = [];
    var msg = Array.prototype.slice.call(arguments, 1).join(' ') +"\r\n";
    socket.write(msg, encoding);
    console.log("SEND:" + msg);
    return msg;
}

var sendPrivmsg = function (socket, msg) {
    return sendMsg(socket, 'PRIVMSG', channelname, ':' + msg);
}

var sendPong = function (socket) {
    return sendMsg(socket, 'PONG ', ':' + serverAddr);
}

var getPeerName = function (msg) {
    return msg.split('!')[0].slice(1);
}

var getTextMsg = function (msg) {
    return msg.split(' :')[1]
}

var executeCmd = function (socket, peer, botCmd) {
    /*
      Execute the command in text given by peer
     */
    cmd = '';
    args = '';
    index = botCmd.indexOf(' ');
    if (index != -1) {
        cmd = botCmd.slice(0,index);
        args = botCmd.slice(index + 1);
    } else {
        cmd = botCmd;
    }

    
    if (cmdList.hasOwnProperty(cmd)) {
        console.log('cmd:', cmd);
        console.log('args:', args);        
        cmdList[cmd](socket, peer, args);
    } else {
        console.log('cmd:', cmd);
        console.log('args:', args);
        cmdList['dontcare'](socket, peer, args);
    }
}

var processMsg = function (socket, msg) {
    /* Format of an message from server
      :<nickname>!~<nickname2>@<ipaddr> PRIVMSG #<channel> :<content>
      Format of an command from client
      BOT: <cmd> <args>
     */
    data = msg.split(' ');
    
    if (data[0] == 'PING') {
        return sendPong(socket);
    }
    if (data[1] == 'PRIVMSG') {
        time = new Date().toString();
        peer = getPeerName(msg);
        text = getTextMsg(msg);
        console.log('Peer:', peer);
        console.log('Text:', text);
        if (text.indexOf(callBotStr) == 0) {
            botCmd = text.split(callBotStr)[1];
            console.log('botCmd:', botCmd);
            executeCmd(socket, peer, botCmd);
        }
    }
}

var connect = function () {
    var socket = new net.Socket();
    socket.setEncoding(encoding);
    socket.on('connect', function () {
        setTimeout(function () {
            sendMsg(socket, 'NICK', botname);
            sendMsg(socket, 'USER', botname, '8 * :', botname);
            sendMsg(socket, 'JOIN', channelname);
        }, 2000);
    });

    socket.on('data', function (data) {
        data = data.split('\r\n');
        for (var i = 0; i < data.length; i++)
            if (data[i] != '') {
                console.log('RECEIVE:', data[i]);
                processMsg(socket, data[i]);
            }
    });

    socket.on('error', function (err) {
        console.log('ERROR:' + err.toString());
    });

    socket.connect(serverPort, serverAddr);
}

connect();

/*
  Define BOT Command here
  List of command to control the irc bot
  It a json pair:
  command : function (socket, peer, args)
 */
var cmdList = new Object()

cmdList.hello = function (socket, peer, args) {
    args = args || 'To whom?';
    sendPrivmsg(socket, args);
}

cmdList.dontcare = function (socket, peer, args) {
    sendPrivmsg(socket, 'I don\'t know and I don\'t care')
}

cmdList.help = function (socket, peer, args) {
    sendPrivmsg(socket, 'Try bot>{command} {args}. Ex: bot>hello world');
}