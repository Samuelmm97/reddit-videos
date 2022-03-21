import {getInputProps} from 'remotion';
import {useEffect} from 'react';
import {continueRender, staticFile} from 'remotion';
import {useCallback} from 'react';
import {delayRender} from 'remotion';
import {useState} from 'react';
import {Composition} from 'remotion';
import {HelloWorld} from './HelloWorld';
import {Post} from './post';
import {textToSpeech} from './TextToSpeech';
import {getAudioData, getAudioDuration} from '@remotion/media-utils';

const inputProps = getInputProps();

export const RemotionVideo: React.FC = () => {
	const [post, setPost] = useState({});
	const [handle] = useState(() => delayRender());
	const [totalDuration, setTotalDuration] = useState(5000);

	const fetchData = useCallback(async () => {
		const response = await fetch(`http://${process.env.IP}:3100/top-posts`);
		const json = await response.json();
		const index = 4;

		const sentences = [json[index].selftext.replaceAll("&", "and")]
		json[index].sentences = sentences;
		json[index].durations = [];
		json[index].audioUrls = [];
		let tempDuration = 0;
		for (const sentence of json[index]?.sentences || []) {
			try {
				const {fileName, wordBoundries} = await textToSpeech(sentence, 'enUSWoman1');
                console.log(wordBoundries);
				const durationInSeconds = await getAudioDuration(fileName);
				json[index].durations.push(durationInSeconds);
				json[index].audioUrls.push(fileName);
                json[index].wordBoundries = wordBoundries;

				tempDuration += durationInSeconds;
			} catch (err) {
				console.log(sentence, err);
			}
		}

		console.log(json[index].sentences, json[index].durations);

		setTotalDuration(Number((tempDuration * 30).toFixed(0)));
		setPost(json[index]);
		if (json[index].sentences.length != json[index].durations.length) {
			console.log('DURATIONS NOT MATCHING!!!!!');
			return;
		}

		continueRender(handle);
	}, [handle]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);
	if (!process.env.AZURE_TTS_KEY) {
		throw new Error(
			'AZURE_TTS_KEY environment variable is missing. Read the docs first and complete the setup.'
		);
	}
	if (!process.env.AZURE_TTS_REGION) {
		throw new Error(
			'AZURE_TTS_REGION environment variable is missing. Read the docs first and complete the setup.'
		);
	}
	if (!process.env.AWS_S3_BUCKET_NAME) {
		throw new Error(
			'AWS_S3_BUCKET_NAME environment variable is missing. Read the docs first and complete the setup.'
		);
	}
	if (!process.env.AWS_S3_REGION) {
		throw new Error(
			'AWS_S3_REGION environment variable is missing. Read the docs first and complete the setup.'
		);
	}
	if (!process.env.AWS_ACCESS_KEY_ID) {
		throw new Error(
			'AWS_ACCESS_KEY_ID environment variable is missing. Read the docs first and complete the setup.'
		);
	}
	if (!process.env.AWS_SECRET_ACCESS_KEY) {
		throw new Error(
			'AWS_SECRET_ACCESS_KEY environment variable is missing. Read the docs first and complete the setup.'
		);
	}

	return (
		<>
			<Composition
				id="HelloWorld"
				component={Post}
				durationInFrames={totalDuration ?? 30}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					postData: post,
				}}
			/>
		</>
	);
};
