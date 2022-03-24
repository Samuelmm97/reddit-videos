/* eslint-disable react/jsx-closing-tag-location */
/* eslint-disable react/jsx-indent */
import {useEffect} from 'react';
import {continueRender} from 'remotion';
import {useCallback} from 'react';
import {delayRender} from 'remotion';
import {useState} from 'react';
import {
	Img,
	interpolate,
	Sequence,
	Series,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Title} from './HelloWorld/Title';
import upvote from './assets/upvoteReddit.png';
import downvote from './assets/RedditDownvote.png'
import {textToSpeech} from './TextToSpeech';
import {getAudioData} from '@remotion/media-utils';
import {getCompositions} from '@remotion/renderer';
import {SpeechSynthesisWordBoundaryEventArgs} from 'microsoft-cognitiveservices-speech-sdk';
interface PostData {
	title: string;
	ups: number;
	selftext: string;
	all_awardings: Awarding[];
	num_comments: number;
	id: string;
	authorName: string;
	subreddit_name_prefixed: string;
	paragraphs: string[];
	durations: number[];
	audioUrls: string[];
	wordBoundries: any;
}

interface Awarding {
	icon_url: string;
	count: number;
}

export const Post: React.FC<{
	postData: PostData;
}> = ({postData}) => {
	// const [time, setTime] = useState(0);
	const frame = useCurrentFrame();
	const videoConfig = useVideoConfig();

	const [handle] = useState(() => delayRender());

	const fetchTts = useCallback(async () => {
		continueRender(handle);
	}, [handle, postData]);

	useEffect(() => {
		fetchTts();
	}, [fetchTts]);

	const opacity = interpolate(
		frame,
		[videoConfig.durationInFrames - 25, videoConfig.durationInFrames - 15],
		[1, 0],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}
	);
	const transitionStart = 25;

	return (
		<div
			style={{
				flex: 1,
				backgroundColor: '#1A1A1B',
				color: 'white',
				padding: 30,
			}}
		>
			<div style={{display: 'flex'}}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						flexDirection: 'column',
						alignItems: 'center',
						marginRight: 50,
					}}
				>
					<Img
						style={{height: 40, width: 40, marginRight: 2}}
						src={upvote}
					/>
					<p style={{fontSize: 30, color: '#FF4500', lineHeight: 0}}>
						{postData.ups}
					</p>
					<Img
						style={{height: 40, width: 41, marginRight: 2}}
						src={downvote}
					/>
				</div>

				<div style={{display: 'flex'}}>
					<p style={{fontSize: 30, marginRight: 20}}>
						{postData.subreddit_name_prefixed}{' '}
						<span>Posted by u/{postData.authorName}</span>
					</p>
					{postData?.all_awardings?.map((award: Awarding) => {
						return (
							<div
								key={award.icon_url}
								style={{
									display: 'flex',
									marginRight: 10,
									justifyContent: 'center',
								}}
							>
								<Img
									style={{
										height: 40,
										width: 40,
										marginRight: 2,
										marginTop: 30,
									}}
									src={award.icon_url}
								/>
								<p style={{fontSize: 30}}>{award.count}</p>
							</div>
						);
					})}
				</div>
			</div>
			<Series>
                    {postData?.paragraphs?.map((paragraph: string, i: number) => {
                       
                        return (
                        <Series.Sequence durationInFrames={Number((postData.durations[i] * 30).toFixed(0)) || 5000}>
                            <Title titleText={paragraph} audioUrl={postData.audioUrls[i]} titleColor='white' wordBoundries={postData.wordBoundries[i]} />
                        </Series.Sequence>
                        )
                    })}
                    
			    </Series>
		</div>
	);
};
