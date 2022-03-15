import {useEffect} from 'react'
import {continueRender, staticFile} from 'remotion'
import {useCallback} from 'react'
import {delayRender} from 'remotion'
import { useState } from 'react';
import {Composition} from 'remotion';
import {HelloWorld} from './HelloWorld';

export const RemotionVideo: React.FC = () => {
    const [title, setTitle] = useState('');
    const [handle] = useState(() => delayRender());
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

    const fetchData = useCallback(async () => {
        const response = await fetch('http://192.168.0.17:3100/top-posts');
        const json = await response.json();
        setTitle(json[3].selftext)
        console.log(json[6].selftext);
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
				component={HelloWorld}
				durationInFrames={5000}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					titleText: title,
					titleColor: 'black',
				}}
			/>
		</>
	);
};
