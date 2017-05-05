import React from 'react';
import render from 'react-dom';
import videojs from 'video.js';
import _ from 'lodash';
import RadialProgress from '../RadialProgress/RadialProgress.jsx';

export default class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.onVolumeChange = _.debounce(this.onVolumeChange,100);
        this.state = {
            currentTime: 0,
            duration: 1,
            played: [],
            totalPlayed: 0,
            totalPlays: 0,
            totalSeekeds: 0,
            totalPauses: 0,
            totalEndeds: 0,
            timeWatched: 0,
            totalCompletePlays: 0,
            volume: 0
        };
    }
    componentDidMount() {
        // instantiate video.js
        this.player = videojs(this.videoNode, this.props/*, this.onPlayerReady*/);
        this.setState({volume: this.player.volume()});
        this.player.on('ended', (e) => { 
            return this.onCountEvent(e);
        });
        this.player.on('useractive', (e) => { 
            console.log('user active');
        });
        this.player.on('seeked', (e) => { 
            return this.onCountEvent(e);
        });
        this.player.on('play', (e) => {
            return this.onCountEvent(e);
        });
        this.player.on('volumechange', (e) => { 
            return this.onVolumeChange(e);
        });
        this.player.on('pause', (e) => { 
            return this.onCountEvent(e)
        });
        this.player.on('timeupdate', () => {
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
                    currentTime: this.player.currentTime(),
                    duration: this.player.duration(),
                    played,
                    percentLeft: (100 - (this.state.currentTime / this.state.duration) * 100).toFixed(2),
                    totalPlayed: (totalPlayed / this.player.duration()) * 100
                });
                // reset player when completely viewed
                // and currentTime === duration
                if (this.state.totalPlayed === 100) {
                    if (this.state.duration === this.state.currentTime) {
                        console.info('completely watched!');
                        this.setState({
                            totalCompletePlays: this.state.totalCompletePlays + 1,
                            totalPlayed: 0
                        });
                        this.player.load();   
                    }         
                }
            });
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }

    onCountEvent(e) {
        const name = `total${_.capitalize(e.type)}s`;
        this.setState({
            [name]: this.state[name] + 1
        });
    }

    onVolumeChange(e) {
        this.setState({
            volume: this.player.muted() ? 0: this.player.volume()
        })
    }

    parseTimePlayed() {
        const played = [];
        let totalLength = 0;
        this.state.played.forEach((p, idx) => {
            const total = this.player.duration();
            const prev = this.state.played[idx-1];
            let percentMissing = 0;
            let length = idx === 0 ? p.end: p.end-p.start;
            totalLength += length;
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
        return {played, totalLength};
    }
    // wrap the player in a div with a `data-vjs-player` attribute so videojs won't
    // create additional wrapper in the DOM see
    // https://github.com/videojs/video.js/pull/3856
    render() {
        const time = this.parseTimePlayed();
        // seconds to HH:MM:SS
        var date = new Date(null);
        date.setSeconds(time.totalLength);
        time.totalLength = date.toISOString().substr(11, 8);
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
                    {time.played}
                </div>
                <div className="basic-stats">
                    Play clicks: {this.state.totalPlays} <br />
                    Pause clicks: {this.state.totalPauses} <br />
                    Times seeked: {this.state.totalSeekeds} <br />
                    Times ended: {this.state.totalEndeds} <br />
                    Time watched: {time.totalLength} <br />
                    Total views: {this.state.totalCompletePlays}                    
                </div>
                <div className="graphs-and-charts">
                    {/* percent viewed*/}
                    <div className="col-sm-4 col-xs-12 text-center">
                        <h4>Percent Viewed</h4>
                        <RadialProgress 
                            percent={this.state.totalPlayed.toFixed(0)} 
                            title={`${this.state.totalPlayed.toFixed(0)}%`} 
                            color="green"
                        />
                    </div>
                    {/*percent skipped*/}
                    <div className="col-sm-4 col-xs-12 text-center">
                        <h4>Percent Unwatched</h4>
                        <RadialProgress 
                            percent={100 - this.state.totalPlayed.toFixed(0)}
                            title={`${100 - this.state.totalPlayed.toFixed(0)}%`}
                            color="orange"
                        />      
                    </div>
                    {/*volume*/}
                    <div className="col-sm-4 col-xs-12 text-center">
                        <h4>Volume</h4>
                        <RadialProgress
                            percent={this.state.volume * 100} 
                            color="blue"
                        />      
                    </div>
                </div>                
            </div>
        )
    }
}