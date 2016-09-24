"use strict";

require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const htmling = require('htmling');
const Pusher = require('pusher');

const poem = require('./poem.json');
const channelName = 'presence-literate-giggle';
let audience = [];
let currentPosition = 0;
let missingPerson;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.engine('html', htmling.express(__dirname + '/views/', {watch:true}));
app.set('view engine', 'html');

// pusher stuff
let pusher = new Pusher({
  appId: process.env.PUSHID,
  key: process.env.PUSHKEY,
  secret: process.env.PUSHSEC,
  cluster: 'eu'
});
pusher.port = 443;

app.get('/', (req, res) => {
  currentPosition = 0;
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
  req.word = { word1: poem[0][currentPosition],  word2: poem[1][currentPosition], index: currentPosition };
  currentPosition++;
  res.render('audience', req);
});

app.post('/go', (req, res) => {
  pusher.trigger('presence-literate-giggle', 'client-finished-speaking', {i:-1});
  missingPerson = setTimeout(() => {
    pusher.trigger('presence-literate-giggle', 'client-finished-speaking', {i:0});
  }, 5000);
  res.send(200);
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

app.post('/channelhook', (req, res) => {
  console.log(req.body)
  const webhook = pusher.webhook({
    rawBody: JSON.stringify(req.body),
    headers: req.headers
  });

  if(!webhook.isValid()) {
    console.log('Invalid webhook');
    return res.send(400);
  } else {
    res.send(200);
  }

  webhook.getEvents().forEach( e => {
    if(e.channel === channelName) {
      if(e.name === 'member_added') {
        audience.push(e.user_id);
      }
      if(e.name === 'member_removed') {
        audience = audience.filter(a => a !== e.user_id);
      }
      if(e.event === 'client-finished-speaking') {
        clearTimeout(missingPerson);
        let data = JSON.parse(e.data);
        if(parseInt(data.i) < currentPosition) {
          missingPerson = setTimeout(() => {
            pusher.trigger('presence-literate-giggle', 'client-finished-speaking', {i:parseInt(data.i) + 1});
          }, 5000);
        }
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
