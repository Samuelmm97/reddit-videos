import {useRef} from 'react'
import {useCallback, useEffect, useState} from 'react';
import { getAudioData } from "@remotion/media-utils";
import {
	Audio,
	continueRender,
	delayRender,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {textToSpeech} from '../TextToSpeech';
import { staticFile } from 'remotion';

export const Title: React.FC<{
	titleText: string;
	titleColor: string;
}> = ({titleText, titleColor}) => {
    const audioRef = useRef({} as HTMLAudioElement);
	const videoConfig = useVideoConfig();
	const frame = useCurrentFrame();
	const text = titleText?.split(' ').map((t) => ` ${t} `);

	const [handle] = useState(() => delayRender());
	const [audioUrl, setAudioUrl] = useState('');

    const onLoadedMetadata = () => {
        if (audioRef.current) {
            console.log(audioRef.current.duration);
        }
    };

	const fetchTts = useCallback(async () => {
		const fileName = await textToSpeech(titleText, 'enUSWoman1');

		setAudioUrl(fileName);
        // console.log(getAudioData(fileName));

		continueRender(handle);
	}, [handle, titleText]);

	useEffect(() => {
		fetchTts();
	}, [fetchTts]);

	return (
		<>
			{audioUrl ? <Audio 
				ref={audioRef}              
				src={audioUrl}
				onLoadedMetadata={onLoadedMetadata}  
                        /> : <></>}
			<h1
				style={{
					fontFamily: 'SF Pro Text, Helvetica, Arial',
					fontWeight: 'bold',
					fontSize: 30,
					textAlign: 'left',
                    marginLeft: 200,
                    marginRight: 200,
                    marginTop: 250
				}}
			>
				{text?.map((t, i) => {
					return (
						<span
							style={{
								color: titleColor,
								marginLeft: 5,
								marginRight: 5,
								display: 'inline-block',
							}}
						>
							{t}
						</span>
					);
				})}
			</h1>
		</>
	);
};
