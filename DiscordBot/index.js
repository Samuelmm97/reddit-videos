require("dotenv").config;
const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("discord.js");

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
});

const discordToken = process.env.DISCORD_TOKEN;
const app = express();

app.use(bodyParser.json({ limit: "1000mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "1000mb" }));

const port = process.env.PORT || 4000;

const SAMID = "200823277797507073";
const HUNTERID = "242665762853093378";

async function notify(message) {
  const sam = await client.users.fetch(SAMID);
  sam.send(message);

  const hunter = await client.users.fetch(HUNTERID);
  hunter.send(message);
}

client.once("ready", async () => {
  console.log("ready!");
});

app.post("/send-auth", (req, res) => {
  const { url } = req.body;
  console.log(url);
  notify(url);
});

app.listen(port, () => {
  console.log("Port:", port);
});

client.login(discordToken);
