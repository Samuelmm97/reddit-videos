const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
const cors = require("cors");
app.use(
  cors({
    origin: "*",
  })
);


const port = process.env.PORT || 3001;
// Configuration File for Snoowrap and Snoostorm

const tifuSubbredditID = "2to41";

// Requiring Snoowrap
const Snoowrap = require('snoowrap');
const auth = {
    userAgent: process.env.USER_AGENT,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
}

const config = {
    requestDelay: 5000,
    warnings: true,
    continueAfterRatelimitError: false,
    retryErrorCodes: [502, 503, 504, 522],
    debug: false
}

// [Stream Requester]
const r = new Snoowrap(auth);
r.config(config)

app.get("/top-posts", async (req, res) => {
    let tifuPosts = await (await r.getSubreddit('tifu')).getHot();
    let posts = [];
    tifuPosts.forEach(async (post) => {
        let tempPost = {
            title: post.title,
            ups: post.ups,
            selftext: post.selftext
        }
        posts.push(tempPost);
    });
    res.send(posts);
    fs.writeFile("test.json", JSON.stringify(posts), 'utf8', function(err) {
        if (err) {
            return console.log(err);
        }
        console.log("file saved");
    })
})


async function getPosts() {
    let hotPosts = await r.getHot();
    let tifuPosts = await (await r.getSubreddit('tifu')).getHot();
    // console.dir(tifuPosts[6], {depth: 10});
    tifuPosts.forEach(async (post) => {
        console.log(post.title, " - ", post.ups);
        // let replies = await r.getSubmission(post.id).comments[0];
        // replies && console.log(replies.body);
        // replies.forEach((reply) => console.log(reply));
    });
}

getPosts();

app.listen(port, () => {
    console.log("listening on port ", port);
})

