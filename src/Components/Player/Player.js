import React from 'react';
import render from 'react-dom';
import videojs from 'video.js'

export default class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTime: 0,
            duration: 1,
            played: [],
            totalPlayed: 0,
            totalPlays: 0,
            volume: 0
        };
    }
    componentDidMount() {
        // instantiate video.js
        this.player = videojs(this.videoNode, this.props, this.onPlayerReady);
        this.setState({volume: this.player.volume()});
        this
            .player
            .on('play', () => { return this.onPlay(); });
        this
            .player
            .on('volumechange', (e) => { return this.onVolumeChange(e); });
        this
            .player
            .on('pause', this.onPause);
        this
            .player
            .on('timeupdate', () => {
                const numSegments = this.player.tech_.el_.played.length;
                const played = [];
                let totalPlayed = 0;
                for (let i = 0; i < numSegments; i++) {
                    let obj = {
                        start: this.player.tech_.el_.played.start(i),
                        end: this.player.tech_.el_.played.end(i)
                    };
                    totalPlayed += (obj.end - obj.start);
                    played.push(obj);
                }
                this.setState({
                    currentTime: this
                        .player
                        .currentTime(),
                    duration: this
                        .player
                        .duration(),
                    played,
                    percentLeft: (100 - (this.state.currentTime / this.state.duration) * 100).toFixed(2),
                    totalPlayed: (totalPlayed / this.player.duration()) * 100
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
    onVolumeChange(e) {
        this.setState({
            volume: this.player.volume()
        })
    }
    onPlay() {
        this.setState({
            totalPlays: this.state.totalPlays + 1
        });
    }
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
                    <div className="progress-bar progress-bar-opaque" role="progressbar" style={{width: "100%"}}>
                    </div>
                </div>)
            }
            let percent = (length / total) * 100;
            played.push(<div key={idx} className="progress pull-left" style={{width: `${percent}%`}}>
                <div className="progress-bar progress-bar-fill" role="progressbar" style={{width: "100%"}}>
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
                {/*Empty progress bar below*/}
                <div className="progress pull-left played-vis-empty">
                    <div className="progress-bar progress-bar-opaque" role="progressbar" style={{width: "100%"}}>
                    </div>
                </div>
                {/*video progress bars on top*/}
                <div className="played-vis">
                    {played}
                </div>
                <div className="graphs-and-charts">
                {/* percent viewed*/}
                    <div className="col-sm-4 col-xs-12 text-center">
                        <h4>Percent Viewed</h4>
                        <div className={`green c100 p${this.state.totalPlayed.toFixed(0)}`} style={{float: 'none', margin: '0 auto'}}>
                            <span>{this.state.totalPlayed.toFixed(0)}%</span>
                            <div className="slice">
                                <div className="bar"></div>
                                <div className="fill"></div>
                            </div>
                        </div>
                    </div>
                    {/*percent skipped*/}
                    <div className="col-sm-4 col-xs-12 text-center">
                        <h4>Percent Unwatched</h4>
                        <div className={`c100 p${100 - this.state.totalPlayed.toFixed(0)} orange`} style={{float: 'none', margin: '0 auto'}}>
                            <span>{100 - this.state.totalPlayed.toFixed(0)}%</span>
                            <div className="slice">
                                <div className="bar"></div>
                                <div className="fill"></div>
                            </div>
                        </div>
                    </div>
                    {/*volume*/}
                    <div className="col-sm-4 col-xs-12 text-center">
                        <h4>Volume</h4>
                        <div className={`black c100 p${(this.state.volume * 100).toFixed(0)}`} style={{float: 'none', margin: '0 auto'}}>
                            <span>{(this.state.volume * 100).toFixed(0)}</span>
                            <div className="slice">
                                <div className="bar"></div>
                                <div className="fill"></div>
                            </div>
                        </div>
                    </div>
                </div>
                {/*<div className="progress percent-viewed">
                    <span className="title">Volume: {(this.state.volume * 100).toFixed(0)}</span>
                    <div className="progress-bar progress-bar-success" role="progressbar" style={{width: `${this.state.totalPlayed.toFixed(2)}%`}}>
                    </div>
                </div>*/}
            </div>
        )
    }
}