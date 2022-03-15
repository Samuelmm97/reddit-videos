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
    const tifuPosts = await (await r.getSubreddit('tifu')).getHot();
    const posts = [];
    //console.log(tifuPosts[4])
    tifuPosts.forEach(async (post) => {
        const tempPost = {
            title: post.title,
            ups: post.ups,
            selftext: post.selftext,
            all_awardings: post.all_awardings,
            num_comments: post.num_comments,
            id: post.id,
            authorName: post.author.name,
            subreddit_name_prefixed: post.subreddit_name_prefixed,
        }
        posts.push(tempPost);
    });
    res.send(posts);
})

app.listen(port, () => {
    console.log("listening on port ", port);
})

