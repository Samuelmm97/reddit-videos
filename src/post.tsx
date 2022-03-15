/* eslint-disable react/jsx-closing-tag-location */
/* eslint-disable react/jsx-indent */
import {Img, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {Title} from './HelloWorld/Title';

interface PostData {
    title: string,
    ups: number,
    selftext: string,
    all_awardings: Awarding[],
    num_comments: number,
    id: string,
    authorName: string,
    subreddit_name_prefixed: string,
}

interface Awarding {
    icon_url: string,
    count: number
}

export const Post: React.FC<{
	postData: PostData
}> = ({postData}) => {
	const frame = useCurrentFrame();
	const videoConfig = useVideoConfig();

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
		<div style={{flex: 1, backgroundColor: '#1A1A1B', color: 'white'}}>
			<p style={{fontSize: 40}}>{postData.ups}</p>
            <div style={{display: "flex"}}>
                <p style={{fontSize: 30, marginRight: 20}}>{postData.subreddit_name_prefixed} <span>Posted by u/{postData.authorName}</span></p>
                {postData?.all_awardings?.map((award: Awarding) => {
                    return (
                        <div style={{display: 'flex', marginRight: 10, justifyContent: 'center', alignItems: 'center'}}>
                            <Img style={{height: 40, width: 40, marginRight: 2}} src={award.icon_url}/>
                            <p style={{fontSize:30}}>{award.count}</p>
                        </div>
                        )
                })}
                <div style={{opacity}}>
                    <Sequence from={transitionStart + 10}>
                        <Title titleText={postData.selftext} titleColor='white' />
                    </Sequence>
			    </div>
            </div>
		</div>
	);
};
