require("dotenv").config();
const express = require("express");
// const FormData = require("form-data");
const bodyParser = require("body-parser");
const { google } = require("googleapis");

const { OAuth2 } = google.auth;

const app = express();
app.use(bodyParser.json({ limit: "1000mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "1000mb" }));

const port = process.env.PORT || 6000;
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const TOKEN_DIR =
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
  "/.credentials/";
const TOKEN_PATH = "./credentials/token.json";
let readStreamInput = null;

// Authorize a client with the loaded credentials, then call the YouTube API.
const clientSecret = process.env.CLIENT_SECRET;
const clientId = process.env.CLIENT_ID;
const redirectUrl = "http://localhost:8000/oauth2callback";
const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

function authorize() {
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err || JSON.parse(token.toString()).expiry_date < Date.now()) {
      getNewToken(oauth2Client);
    } else {
      oauth2Client.credentials = JSON.parse(token.toString());
      uploadVideo(oauth2Client, readStreamInput, title);
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
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("test", authUrl);
  fetch(`http://${process.env.IP}:4000/send-auth`, {
    body: JSON.stringify({
      url: "Authorize this app by visiting this url: " + authUrl,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
  });
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
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log("Token stored to " + TOKEN_PATH);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {string} readStream The URL for the video upload
 * @param {string} title The title of our video
 */
function uploadVideo(auth, readStream, title) {
  const service = google.youtube("v3");
  service.videos.insert(
    {
      auth,
      requestBody: {
        snippet: {
          title: "r/tifu " + title,
          description: "Reddit Tifu text to voice",
        },
        status: {
          privacyStatus: "public",
        },
      },
      // This is for the callback function
      part: ["snippet", "status"],

      // Create the readable stream to upload the video
      media: {
        body: fs.createReadStream(readStream),
      },
    },
    (err, data) => console.log("done")
  );
}

app.get("/oauth2callback", (req, res) => {
  const { code } = req.query;
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.log("Error while trying to retrieve access token", err);
      return;
    }
    oauth2Client.credentials = token;
    storeToken(token);
    uploadVideo(oauth2Client, readStreamInput, title);
  });
  res.status(200).send("success");
});

app.post("/upload", (req, res) => {
  console.log(req.body);
  res.status(200).send("success");
});

app.listen(port, () => console.log("Port: ", port));
