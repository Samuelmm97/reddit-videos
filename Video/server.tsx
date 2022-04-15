/**
 * This is an example of a server that returns dynamic video.
 * Run `npm run server` to try it out!
 * If you don't want to render videos on a server, you can safely
 * delete this file.
 */

import {bundle} from '@remotion/bundler';
import {
	getCompositions,
	renderFrames,
	stitchFramesToVideo,
} from '@remotion/renderer';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {textToSpeech} from './src/TextToSpeech';
import fetch from 'cross-fetch';
import md5 from 'md5';
import FormData from 'form-data';
import bodyParser from 'body-parser';
import {google} from 'googleapis';

const {OAuth2} = google.auth;
globalThis.fetch = fetch;

const app = express();
app.use(bodyParser.json({limit: '1000mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '1000mb'}));
const port = process.env.PORT || 8000;
const compositionId = 'HelloWorld';

const cache = new Map<string, string>();

let title = '';

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_DIR =
	(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
	'/.credentials/';
const TOKEN_PATH = './credentials/token.json';
let readStreamInput = null;

// Authorize a client with the loaded credentials, then call the YouTube API.
const clientSecret = process.env.CLIENT_SECRET;
const clientId = process.env.CLIENT_ID;
const redirectUrl = 'http://localhost:8000/oauth2callback';
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
		access_type: 'offline',
		scope: SCOPES,
	});
	console.log('test', authUrl);
	fetch(`http://${process.env.IP}:4000/send-auth`, {
		body: JSON.stringify({
			url: 'Authorize this app by visiting this url: ' + authUrl,
		}),
		method: 'POST',
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
 * @param {string} title The title of our video
 */
function uploadVideo(auth, readStream, title) {
	const service = google.youtube('v3');
	service.videos.insert(
		{
			auth,
			requestBody: {
				snippet: {
					title: 'r/tifu ' + title,
					description: 'Reddit Tifu text to voice',
				},
				status: {
					privacyStatus: 'public',
				},
			},
			// This is for the callback function
			part: ['snippet', 'status'],

			// Create the readable stream to upload the video
			media: {
				body: fs.createReadStream(readStream),
			},
		},
		(err, data) => {
			console.log('Done.', err, data);
		}
	);
}

app.get('/oauth2callback', (req, res) => {
	const {code} = req.query;
	oauth2Client.getToken(code as string, (err, token) => {
		if (err) {
			console.log('Error while trying to retrieve access token', err);
			return;
		}
		oauth2Client.credentials = token;
		storeToken(token);
		uploadVideo(oauth2Client, readStreamInput, title);
	});
	console.log(req);
});

app.post('/', async (req, res) => {
	const {body} = req;
	console.log(req.body);
	const {posts} = req.body;
	try {
		// const response = await fetch(`http://${process.env.IP}:3100/top-posts`);
		// const posts: any = await response.json();
		const index = 2;
		title = posts[index].title;
		const sentences = posts[index].selftext
			.replaceAll('&', 'and')
			// eslint-disable-next-line no-useless-escape
			.match(/[^\.!\?]+[\.!\?]+/g);
		const sentencesPerParagraph = 20;
		const paragraphs = [];
		for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
			let paragraph = '';
			if (i + sentencesPerParagraph < sentences.length) {
				paragraph = sentences
					.slice(i, i + sentencesPerParagraph)
					.join(' ');
			} else {
				paragraph = sentences.slice(i, sentences.length).join(' ');
			}
			paragraphs.push(paragraph);
		}
		posts[index].paragraphs = paragraphs;
		posts[index].durations = [];
		posts[index].audioUrls = [];
		let tempDuration = 0;
		posts[index].wordBoundries = [];
		for (const paragraph of posts[index]?.paragraphs || []) {
			try {
				const {audioData, wordBoundries} = await textToSpeech(
					paragraph,
					'enUSWoman1'
				);
				console.log(wordBoundries);
				const fileName = md5(paragraph) + '.wav';
				// await fs.promises.open(fileName, 'w');
				await fs.promises.writeFile(
					'./public/' + fileName,
					new Uint8Array(audioData)
				);
				const durationInSeconds = Number(
					Number(
						(
							wordBoundries[wordBoundries.length - 1] * 1.04
						).toFixed(0)
					)
				);
				posts[index].durations.push(durationInSeconds / 30);
				posts[index].audioUrls.push(fileName);
				posts[index].wordBoundries.push(wordBoundries);

				tempDuration += durationInSeconds;
			} catch (err) {
				console.log(paragraph, err);
			}
		}

		posts[index].totalDuration = tempDuration;

		console.log(posts[index].paragraphs, posts[index].durations);

		if (posts[index].paragraphs.length != posts[index].durations.length) {
			console.log('DURATIONS NOT MATCHING!!!!!');
			return;
		}

		const bundled = await bundle(path.join(__dirname, './src/index.tsx'));
		const comps = await getCompositions(bundled, {
			inputProps: posts[index],
			envVariables: process.env as Record<string, string>,
		});
		const video = comps.find((c) => c.id === compositionId);
		if (!video) {
			throw new Error(`No video called ${compositionId}`);
		}
		res.set('content-type', 'video/mp4');

		const tmpDir = await fs.promises.mkdtemp(
			path.join(os.tmpdir(), 'remotion-')
		);
		const startDate = Math.round(new Date().getTime() / 1000);

		const {assetsInfo} = await renderFrames({
			config: video,
			webpackBundle: bundled,
			onStart: () => console.log('Rendering frames...'),
			onFrameUpdate: (f) => {
				const endDate = Math.round(new Date().getTime() / 1000);
				const elapsed = endDate - startDate;
				console.log(`Rendered frame ${f}`, 'Elapsed seconds:', elapsed);
			},
			onError: (e) => {
				console.log(e);
			},
			envVariables: process.env as Record<string, string>,
			parallelism: os.cpus().length - 1,
			outputDir: tmpDir,
			inputProps: posts[index],
			compositionId,
			imageFormat: 'jpeg',
			timeoutInMilliseconds: 3000000,
			quality: 10,
			chromiumOptions: {
				gl: 'angle',
			},
		});

		const finalOutput = path.join(tmpDir, 'out.mp4');
		await stitchFramesToVideo({
			dir: tmpDir,
			force: true,
			fps: video.fps,
			height: video.height,
			width: video.width,
			outputLocation: finalOutput,
			imageFormat: 'jpeg',
			assetsInfo,
		});
		cache.set(JSON.stringify(req.query), finalOutput);

		readStreamInput = finalOutput;

		res.end();
		authorize();

		console.log('Video rendered and sent!');
	} catch (err) {
		console.error(err);
		res.json({
			error: err,
		});
	}
});

app.listen(port);

console.log(
	[
		`The server has started on http://localhost:${port}`,
		'You can render a video by passing props as URL parameters.',
		'',
		'If you are running Hello World, try this:',
		'',
		`http://localhost:${port}?titleText=Hello,+World!&titleColor=red`,
		'',
	].join('\n')
);
