"use strict";

require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const htmling = require('htmling');
const Pusher = require('pusher');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  var thisUrl = req.protocol + '://' + req.get('host');
  req.THIS_URL = thisUrl;
  req.JOIN_URL = thisUrl+'/audience';
  req.PUSHKEY = process.env.PUSHKEY;
  res.render('index', req);
});

// phone view seq
app.get('/audience', (req, res) => {
  var thisUrl = req.protocol + '://' + req.get('host');
  req.THIS_URL = thisUrl;
  req.PUSHKEY = process.env.PUSHKEY;
  res.render('audience', req);
});

app.post('/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channelName = req.body.channel_name;
  res.send(pusher.authenticate(
    socketId, 
    channelName,
    {user_id: socketId, user_info: {}})
  );
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.engine('html', htmling.express(__dirname + '/views/', {watch:true}));
app.set('view engine', 'html');

// pusher stuff
var pusher = new Pusher({
  appId: process.env.PUSHID,
  key: process.env.PUSHKEY,
  secret: process.env.PUSHSEC
});
pusher.port = 443;

