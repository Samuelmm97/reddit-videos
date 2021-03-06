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
				durationInFrames={inputProps.totalDuration ?? 30}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					postData: inputProps,
				}}
			/>
		</>
	);
};
