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
        //average length of views
        // highlight hottest parts of video?
        this.state = {
            master: {
                views: 0,
                runningTotal: 0,
                playedLengths: []
            },
            session: {
                currentTime: 0,
                duration: 1,
                percentViewed: 0,
                totalPlays: 0,
                totalPauses: 0,
                totalLength: 0,
                volume: 1
            }
        };
    }

    onLoadedMetadata(e) {
        let parts = this.player.tech_.el_.currentSrc.split('/');
        let name = parts[parts.length - 1].split('.')[0];
        this.videoId = name;
        // grab values from database
        firebase.database().ref(this.videoId).once('value').then((snapshot) => {
            let master = _.extend(this.state.master, snapshot.val());
            this.setState({master});
            this.ogRunningTotal = this.state.master.runningTotal;
            this.ogPlayedLengths = this.state.master.playedLengths;
        });
    }

    componentDidMount() {
        // instantiate video.js
        // other events: ['useractive']
        this.player = videojs(this.videoNode, this.props/*, this.onPlayerReady*/);
        this.setState({volume: this.player.volume()});
        this.player.on('pause', (e) => { 
            return this.onCountEvent(e);
        });
        this.player.on('play', (e) => { 
            return this.onCountEvent(e);
        });
        this.player.on('loadedmetadata', (e) => { 
            return this.onLoadedMetadata(e);
        });
        this.player.on('volumechange', (e) => { 
            return this.onVolumeChange(e);
        });
        this.player.on('timeupdate', () => {
            const data = this.parseTimePlayed();
            let session = _.extend(this.state.session, data.session);
            let master = _.extend(this.state.master, data.master);
            // add one to master views
            if (this.state.session.percentViewed === 100) {
                console.info('completely watched!');
                let totalCount = this.state.master.views;
                totalCount++;
                master.views = totalCount;
            }
            
            this.setState({
                session,
                master
            });

            firebase.database().ref(this.videoId).set(master);
        });
    }

    onCountEvent(e) {
        const name = `total${_.capitalize(e.type)}s`;
        // firebase.database().ref(`/${this.videoId}/${name}`).set(this.state.session[name] + 1);
        let session = _.extend({}, this.state.session);
        session[name] = this.state.session[name] + 1
        this.setState({
            session
        });
    }

    onVolumeChange(e) {
        let session = _.extend({}, this.state.session);
        let master = _.extend({}, this.state.master);
        var sessionObj = _.extend({}, this.state.session);
        session.volume = this.player.muted() ? 0: this.player.volume();
        this.setState({session, master});
        // firebase.database().ref(`/${this.videoId}/volume`).set(this.state.session.volume);
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
                end: this.player.tech_.el_.played.end(i),
                userId: this.props.userId
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
        return {
            master: {
                runningTotal,
                playedLengths: this.ogPlayedLengths.concat(playedLengths)
                // runningTotalISO: runningTotalISO
            },
            session: {
                currentTime: this.player.currentTime(),
                duration: this.player.duration(),
                percentLeft: (100 - (this.player.currentTime ()/ this.player.duration()) * 100).toFixed(2),
                percentViewed: (totalLength / this.player.duration()) * 100,
                playedListEls,
                totalLength
            }
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
        const date = new Date(null);
        date.setSeconds(this.state.master.runningTotal);
        const runningTotalISO = date.toISOString().substr(11, 8);
        date.setSeconds(this.state.session.totalLength);
        const totalLengthISO = date.toISOString().substr(11, 8);
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
                    {this.state.session.playedListEls}
                </div>
                <div className="basic-stats">
                    Play clicks: {this.state.session.totalPlays} <br />
                    Pause clicks: {this.state.session.totalPauses} <br />
                    Time watched: {totalLengthISO} <br />
                    Total views: {this.state.master.views} <br />                  
                    Time viewed overall: {runningTotalISO}             
                </div>
                <div className="graphs-and-charts">
                    {/* percent viewed*/}
                    <div className="col-sm-4 col-xs-12 text-center">
                        <h4>Percent Viewed</h4>
                        <RadialProgress 
                            percent={this.state.session.percentViewed.toFixed(0)} 
                            title={`${this.state.session.percentViewed.toFixed(0)}%`} 
                            color="green"
                        />
                    </div>
                    {/*percent skipped*/}
                    <div className="col-sm-4 col-xs-12 text-center">
                        <h4>Percent Unwatched</h4>
                        <RadialProgress 
                            percent={100 - this.state.session.percentViewed.toFixed(0)}
                            title={`${100 - this.state.session.percentViewed.toFixed(0)}%`}
                            color="orange"
                        />      
                    </div>
                    {/*volume*/}
                    <div className="col-sm-4 col-xs-12 text-center">
                        <h4>Volume</h4>
                        <RadialProgress
                            percent={this.state.session.volume * 100} 
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