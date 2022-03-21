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
import {
    SpeechSynthesisWordBoundaryEventArgs
} from 'microsoft-cognitiveservices-speech-sdk';

export const Title: React.FC<{
	titleText: string;
	titleColor: string;
    audioUrl: string;
    wordBoundries: SpeechSynthesisWordBoundaryEventArgs[]
}> = ({titleText, titleColor, audioUrl, wordBoundries}) => {
	const videoConfig = useVideoConfig();
	const frame = useCurrentFrame();
	const text = titleText?.split(' ').map((t) => ` ${t} `);

	return (
		<>
			{audioUrl ? <Audio               
				src={audioUrl}
                        /> : <></>}
			<h1
				style={{
					fontFamily: 'SF Pro Text, Helvetica, Arial',
					fontSize: 25,
					textAlign: 'left',
                    marginLeft: 200,
                    marginRight: 200,
                    marginTop: 200
				}}
			>
				{text?.map((t, i) => {
					return (
						<span
							style={{
								color: titleColor,
								marginLeft: 5,
								marginRight: 5,
                                transform: `scale(${spring({
									fps: videoConfig.fps,
									frame: frame - ((wordBoundries[i].audioOffset / 330000) ),
									config: {
										damping: 100,
										stiffness: 200,
										mass: 0.5,
									},
								})})`,
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
