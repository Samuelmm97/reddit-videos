const dotenv = require('dotenv').config();
var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var express = require('express');
const app = express();

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = './token.json';

// Authorize a client with the loaded credentials, then call the YouTube API.
authorize();
var clientSecret = process.env.CLIENT_SECRET;
var clientId = process.env.CLIENT_ID;
var redirectUrl = "http://localhost:5000/oauth2callback";
var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

function authorize() {
 

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
   
    if (err || JSON.parse(token.toString()).expiry_date < Date.now()) {
      getNewToken(oauth2Client);
      
    } else {
      
      oauth2Client.credentials = JSON.parse(token.toString());
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {string} readStream The URL for the video upload
 */
function uploadVideo(auth, readStream) {
  var service = google.youtube('v3');
  service.videos.insert({
    auth: auth,
    resource: {
      
      // Video title and description
      snippet: {
        title: "Testing YoutTube API NodeJS module",
        description: "Test video upload via YouTube API"
      },
      status:{
        privacyStatus: "public"
      }
    },
    // This is for the callback function
     part: "snippet,status",

    // Create the readable stream to upload the video
     media: {
      body: readStream
    }
  }, (err, data) => {
    console.log("Done.", err, data);
    process.exit();
  });
}

app.get('/oauth2callback', (req,res) => {
  
  let code = req.query.code;
  oauth2Client.getToken(code, function(err, token) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    }
    oauth2Client.credentials = token;
    storeToken(token);
    //uploadVideo(oauth2Client);
  });
  console.log(req);
 
});

app.post('/upload', (req,res) => {
  authorize();
  uploadVideo(oauth2Client, req.body.readStream);
 

})
const PORT = 5000
// On localhost:3000 you will see your page.
app.listen(PORT);