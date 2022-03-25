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
import {getAudioDuration} from '@remotion/media-utils';
import {textToSpeech} from './src/TextToSpeech';
import fetch from 'cross-fetch';
import md5 from 'md5';
globalThis.fetch = fetch;

const app = express();
const port = process.env.PORT || 8000;
const compositionId = 'HelloWorld';

const cache = new Map<string, string>();

app.get('/', async (req, res) => {
	const sendFile = (file: string) => {
		fs.createReadStream(file)
			.pipe(res)
			.on('close', () => {
				res.end();
			});
	};
	try {
		if (cache.get(JSON.stringify(req.query))) {
			sendFile(cache.get(JSON.stringify(req.query)) as string);
			return;
		}

		const response = await fetch(`http://${process.env.IP}:3100/top-posts`);
		const json: any = await response.json();
		const index = 2;

		const sentences = json[index].selftext
			.replaceAll('&', 'and')
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
		json[index].paragraphs = paragraphs;
		json[index].durations = [];
		json[index].audioUrls = [];
		let tempDuration = 0;
		json[index].wordBoundries = [];
		for (const paragraph of json[index]?.paragraphs || []) {
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
							wordBoundries[wordBoundries.length - 1] * 1.025
						).toFixed(0)
					)
				);
				json[index].durations.push(durationInSeconds / 30);
				json[index].audioUrls.push(fileName);
				json[index].wordBoundries.push(wordBoundries);

				tempDuration += durationInSeconds;
			} catch (err) {
				console.log(paragraph, err);
			}
		}

		json[index].totalDuration = tempDuration;

		console.log(json[index].paragraphs, json[index].durations);

		if (json[index].paragraphs.length != json[index].durations.length) {
			console.log('DURATIONS NOT MATCHING!!!!!');
			return;
		}

		const bundled = await bundle(path.join(__dirname, './src/index.tsx'));
		const comps = await getCompositions(bundled, {
			inputProps: json[index],
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
			inputProps: json[index],
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
		sendFile(finalOutput);
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
