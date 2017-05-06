import React from 'react';
import render from 'react-dom';
import ReactFireMixin from 'reactfire';
import reactMixin from 'react-mixin';
const firebase = require("firebase");
import videojs from 'video.js';
import _ from 'lodash';
import RadialProgress from '../RadialProgress/RadialProgress.jsx';

class VideoPlayer extends React.Component {
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
            volume: 0,
            // runningTotal: 0
        };
    }

    onLoadedMetadata(e) {
        let parts = this.player.tech_.el_.currentSrc.split('/');
        let name = parts[parts.length - 1].split('.')[0];
        this.videoId = name;
        // grab values from database
        firebase.database().ref(this.videoId).once('value').then((snapshot) => {
            this.setState(snapshot.val() || {});
            this.ogRunningTotal = this.state.runningTotal;
        });
    }

    componentDidMount() {
        // instantiate video.js
        // other events: ['useractive']
        this.player = videojs(this.videoNode, this.props/*, this.onPlayerReady*/);
        this.setState({volume: this.player.volume()});
        this.player.on('ended', (e) => { 
            return this.onCountEvent(e);
        });
        this.player.on('pause', (e) => { 
            return this.onCountEvent(e);
        });
        this.player.on('play', (e) => { 
            return this.onCountEvent(e);
        });
        this.player.on('seeked', (e) => { 
            return this.onCountEvent(e);
        });
        this.player.on('loadedmetadata', (e) => { 
            return this.onLoadedMetadata(e);
        });
        this.player.on('volumechange', (e) => { 
            return this.onVolumeChange(e);
        });
        this.player.on('timeupdate', () => {
            const time = this.parseTimePlayed();
            this.setState(time);
            const obj = JSON.parse(JSON.stringify(this.state));
            delete obj.playedListEls;
            firebase.database().ref(this.videoId).set(obj);
            // firebase.database().ref(`/${this.videoId}/runningTotal`).set(this.state.runningTotal);
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

    onCountEvent(e) {
        const name = `total${_.capitalize(e.type)}s`;
        firebase.database().ref(`/${this.videoId}/${name}`).set(this.state[name] + 1);
        this.setState({
            [name]: this.state[name] + 1
        });
    }

    onVolumeChange(e) {
        this.setState({
            volume: this.player.muted() ? 0: this.player.volume()
        })
        firebase.database().ref(`/${this.videoId}/volume`).set(this.state.volume);
    }

    parseTimePlayed() {
        // # viewed segments of video
        const numSegments = this.player.tech_.el_.played.length;
        // hold our parsed/easier to read time segments here
        const playedLengths = [];
        // hold our progress els for the the time segments here
        const playedListEls = [];
        // how much time has this video been played for
        let totalLength = 0;
        // lifetime running time stats
        let runningTotal = this.ogRunningTotal;
        // parse out the time segments from the player/video
        for (let i = 0; i < numSegments; i++) {
            let obj = {
                start: this.player.tech_.el_.played.start(i),
                end: this.player.tech_.el_.played.end(i)
            };
            playedLengths.push(obj);
        }
        
        playedLengths.forEach((p, idx) => {
            const total = this.player.duration();
            const prev = playedLengths[idx-1];
            let percentMissing = 0;
            let length = idx === 0 ? p.end: p.end-p.start;
            totalLength += length;
            if (prev && prev.end !== p.start) {
                percentMissing = ((p.start - prev.end) / total) * 100;
                playedListEls.push(<div key={`${idx}-${idx}`} className="progress pull-left" style={{width: `${percentMissing}%`}}>
                    <div className="progress-bar progress-bar-opaque" role="progressbar" style={{width: "100%"}}>
                    </div>
                </div>)
            }
            let percent = (length / total) * 100;
            playedListEls.push(<div key={idx} className="progress pull-left" style={{width: `${percent}%`}}>
                <div className="progress-bar progress-bar-fill" role="progressbar" style={{width: "100%"}}>
                </div>
            </div>)
        });
        runningTotal += totalLength;
        const date = new Date(null);
        date.setSeconds(totalLength);
        const lengthISO = date.toISOString().substr(11, 8);
        date.setSeconds(runningTotal);
        const runningTotalISO = date.toISOString().substr(11, 8);
        return {
            currentTime: this.player.currentTime(),
            duration: this.player.duration(),
            percentLeft: (100 - (this.player.currentTime ()/ this.player.duration()) * 100).toFixed(2),
            totalPlayed: (totalLength / this.player.duration()) * 100,
            playedListEls,
            totalLength: lengthISO,
            runningTotal: runningTotal,
            runningTotalISO: runningTotalISO
        };
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }

    // wrap the player in a div with a `data-vjs-player` attribute so videojs won't
    // create additional wrapper in the DOM see
    // https://github.com/videojs/video.js/pull/3856
    render() {
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
                    {this.state.playedListEls}
                </div>
                <div className="basic-stats">
                    Play clicks: {this.state.totalPlays} <br />
                    Pause clicks: {this.state.totalPauses} <br />
                    Times seeked: {this.state.totalSeekeds} <br />
                    Times ended: {this.state.totalEndeds} <br />
                    Time watched: {this.state.totalLength} <br />
                    Total views: {this.state.totalCompletePlays} <br />                  
                    Seconds viewed overall: {this.state.runningTotalISO}             
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

reactMixin(VideoPlayer.prototype, ReactFireMixin)

export default VideoPlayer;