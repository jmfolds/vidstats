import React from 'react';
import render from 'react-dom';
import videojs from 'video.js'

export default class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTime: 0,
            duration: 1,
            played: []
        };
    }
    componentDidMount() {
        // instantiate video.js
        this.player = videojs(this.videoNode, this.props, this.onPlayerReady);
        this
            .player
            .on('play', this.onPlay);
        this
            .player
            .on('pause', this.onPause);
        this
            .player
            .on('timeupdate', () => {
                const numSegments = this.player.tech_.el_.played.length;
                const played = [];
                for (let i = 0; i < numSegments; i++) {
                    let obj = {
                        start: this.player.tech_.el_.played.start(i),
                        end: this.player.tech_.el_.played.end(i)
                    };
                    played.push(obj);
                }
                this.setState({
                    currentTime: this
                        .player
                        .currentTime(),
                    duration: this
                        .player
                        .duration(),
                    played
                });
            });
    }

    // destroy player on unmount
    componentWillUnmount() {
        if (this.player) {
            this
                .player
                .dispose()
        }
    }
    onPlayerReady() {
        console.info('Player is ready!');
    }
    onPause() {}
    onPlay() {}
    parseTimePlayed() {
        const played = [];
        this.state.played.forEach((p, idx) => {
            const total = this.player.duration();
            const prev = this.state.played[idx-1];
            let percentMissing = 0;
            let length = idx === 0 ? p.end: p.end-p.start;
            if (prev && prev.end !== p.start) {
                percentMissing = ((p.start - prev.end) / total) * 100;
                played.push(<div key={`${idx}-${idx}`} className="progress pull-left" style={{width: `${percentMissing}%`}}>
                    <div className="progress-bar progress-bar-danger" role="progressbar" style={{width: "100%"}}>
                    </div>
                </div>)
            }
            let percent = (length / total) * 100;
            console.log(percent, percentMissing);
            played.push(<div key={idx} className="progress pull-left" style={{width: `${percent}%`}}>
                <div className="progress-bar progress-bar-success" role="progressbar" style={{width: "100%"}}>
                </div>
            </div>)
        });
        return played;
    }
    // wrap the player in a div with a `data-vjs-player` attribute so videojs won't
    // create additional wrapper in the DOM see
    // https://github.com/videojs/video.js/pull/3856
    render() {
        const played = this.parseTimePlayed();
        return (
            <div data-vjs-container>
                <div data-vjs-player>
                    <video ref={node => this.videoNode = node} className="video-js"></video>
                </div>
                <div className="played-vis">
                    {played}
                </div>
                <div className="percent-viewed">{(100 - (this.state.currentTime / this.state.duration) * 100).toFixed(2)}% left</div>
            </div>
        )
    }
}