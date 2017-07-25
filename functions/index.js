/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
// console.log = function(){}

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Language = require('@google-cloud/language');
const express = require('express');

const app = express();
const language = new Language({projectId: process.env.GCLOUD_PROJECT});

admin.initializeApp(functions.config().firebase);

var bearerToken = '';
var user = '';

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const authenticate = (req, res, next) => {
  next();
  // console.log('1.functions index.js authenticate headers : ', req.headers);
  // if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
  //   res.status(403).send('Unauthorized');
  //   return;
  // }
  //
  // const idToken = req.headers.authorization.split('Bearer ')[1];
  // bearerToken = idToken;
  // admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
  //   user = decodedIdToken;
  //   req.user = user;
  //   next();
  // }).catch(error => {
  //   res.status(403).send('Unauthorized');
  // });
};

app.use(authenticate);

// POST /api/createtoken
// ( url, pin) => UT_hash_key
app.post('/api/token', (req, res) => {
  console.log('1.functions index.js app.post /api/token pin, url : ', pin, url);
  const url = req.query.url;
  const pin = req.query.pin;
  const tokenData = {
    url: url,
    pin: pin
  }
  // Get a key for a new Token.
  var newTokenKey = admin.database().ref().child(`/usertoken/${user.user_id}/tokens`).push().key;

  // Write the new token
  var updates = {};
  updates[`/usertoken/${user.user_id}/tokens` + newTokenKey] = tokenData;
  return res.status(201).send(firebase.database().ref().update(updates));
});

// GET /api/token/{tokenId}
// Get details about a token
app.get('/api/token/:tokenId', (req, res) => {
  const tokenId = req.params.tokenId;
  console.log('1.functions index.js app.get /api/token/:tokenId : ', tokenId);
  admin.database().ref(`/usertoken/${user.user_id}/tokens/${tokenId}`).once('value').then(snapshot => {
    if (snapshot.val() !== null) {
      // Cache details in the browser for 5 minutes
      res.set('Cache-Control', 'private, max-age=300');
      res.status(200).json(snapshot.val());
    } else {
      res.status(404).json({errorCode: 404, errorMessage: `token '${tokenId}' not found`});
    }
  }).catch(error => {
    console.log('Error getting token details', tokenId, error.message);
    res.sendStatus(500);
  });
});

// Expose the API as a function
exports.api = functions.https.onRequest(app);
