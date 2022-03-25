require("dotenv").config();
const Youtube = require("youtube-api")
  , fs = require("fs")
  , readJson = require("r-json")
  , Lien = require("lien")
  , opn = require("opn")
const token = require("./token.json");
const express = require("express");

// Init lien server
let server = new Lien({
  host: "localhost"
  , port: 5000
});

let oauth = Youtube.authenticate({
  type: "oauth",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_url: "http://localhost:5000/oauth2callback"
});

// const test = {
//   access_token: 'ya29.A0ARrdaM9C2u5Tn_JFhlCyL7Loyli9sHE2H28g7kwa_yoyRDxZvIns0LV3GuIKYM2EQebMkPLz9RyDv5Kht5iVL8SB-jLzCL3BYSw0Z2WM2f_AGr6B8hvNhCFK1yKN9o7ecC-1RaaVBF0OpyuTAbq6GhXZc0z7',
//   refresh_token: '1//01MJsDAyzLdNzCgYIARAAGAESNwF-L9IrNeCmcI2zR2aXtlpsWkPd3zCCGnArXBdoDlZnRh5eXvsAT3yHasj_H7GqUy4_tekKXUM',
//   scope: 'https://www.googleapis.com/auth/youtube.upload',
//   token_type: 'Bearer',
//   expiry_date: 1648229361400
// }

console.log(token.expiry_date, Date.now());

if (token && token.expiry_date < Date.now()) {
  oauth.setCredentials(token);
  upload();
} else {
  const login = opn(oauth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.upload"]
  }))
}

function upload() {
  Youtube.videos.insert({
    resource: {
      // Video title and description
      snippet: {
        title: "Testing YoutTube API NodeJS module",
        description: "Test video upload via YouTube API"
      }
      // I don't want to spam my subscribers
      , status: {
        privacyStatus: "public"
      }
    }
    // This is for the callback function
    , part: "snippet,status"

    // Create the readable stream to upload the video
    , media: {
      body: fs.createReadStream("boatvid.mp4")
    }
  }, (err, data) => {
    console.log("Done.", err, data);
    process.exit();
  });
}


// console.log(oauth);

server.addPage("/oauth2callback", lien => {
  console.log("Trying to get the token using the following code: " + lien.query.code);
  oauth.getToken(lien.query.code, (err, tokens) => {

    if (err) {
      lien.lien(err, 400);
      return console.log(err);
    }

    console.log("Got the tokens.", tokens);

    oauth.setCredentials(tokens);

    upload();

    fs.writeFile("token.json", JSON.stringify(tokens), (err) => {
      console.log(err);
    });

    lien.end("The video is being uploaded. Check out the logs in the terminal.");


  });
});