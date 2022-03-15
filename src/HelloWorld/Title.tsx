import {useRef} from 'react'
import {useCallback, useEffect, useState} from 'react';
import {
	Audio,
	continueRender,
	delayRender,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {textToSpeech} from '../TextToSpeech';

export const Title: React.FC<{
	titleText: string;
	titleColor: string;
}> = ({titleText, titleColor}) => {
    const audioRef = useRef({} as HTMLAudioElement);
	const videoConfig = useVideoConfig();
	const frame = useCurrentFrame();
	const text = titleText.split(' ').map((t) => ` ${t} `);

	const [handle] = useState(() => delayRender());
	const [audioUrl, setAudioUrl] = useState('');

    const onLoadedMetadata = () => {
        if (audioRef.current) {
            console.log(audioRef.current.duration);
        }
    };

	const fetchTts = useCallback(async () => {
        console.log("The titleText is", titleText.length)
		const fileName = await textToSpeech(titleText, 'enUSWoman1');

		setAudioUrl(fileName);

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
					textAlign: 'center',
					position: 'absolute',
					height: '100%',
					width: '100%',
				}}
			>
				{text.map((t, i) => {
					return (
						<span
							style={{
								color: titleColor,
								marginLeft: 10,
								marginRight: 10,
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
