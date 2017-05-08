require('./Player.scss');
import React from 'react';
import render from 'react-dom';
import ReactFireMixin from 'reactfire';
import reactMixin from 'react-mixin';
const firebase = require("firebase");
import videojs from 'video.js';
import _ from 'lodash';
import RadialProgress from '../Graphics/RadialProgress.jsx';
import HeatMap from '../Graphics/Heatmap.jsx';

class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.saveToFirebase = _.debounce(this.saveToFirebase,300);
        this.averageWatched = 0;
        this.averageVolume = 100;
        this.volumes = [1];
        //average length of views
        this.state = {
            master: {
                views: 0,
                runningTotal: 0,
                plays: []
            },
            session: {
                percentViewedAllTime: 0,
                currentTime: 0,
                duration: 0,
                percentViewed: 0,
                totalPlays: 0,
                totalPauses: 0,
                totalLength: 0,
                volume: 1
            }
        };
    }

    parseHeatmap(playedLengths) {
        // show "heatmap" of most viewed parts of video
        if (playedLengths && playedLengths.length) {
            let lengths = playedLengths;
            let heatmapEls = [];
            lengths.forEach((l, idx) => {
                heatmapEls.push(<HeatMap key={Math.random()} playedLengths={l} duration={this.player.duration()} />);
            });
            this.heatmapEls = heatmapEls;
            // this.forceUpdate();
        }
    }

    onLoadedMetadata(e) {
        let session = _.extend({}, this.state.session);
        session.volume = this.player.volume();
        session.duration = this.player.duration();
        // this.setState({session});
        let parts = this.player.tech_.el_.currentSrc.split('/');
        let name = parts[parts.length - 1].split('.')[0];
        this.videoId = name;
        // grab values from database
        firebase.database().ref(this.videoId).once('value').then((snapshot) => {
            let master = _.extend(this.state.master, snapshot.val());
            this.parseHeatmap(this.state.master.plays);
            this.ogRunningTotal = this.state.master.runningTotal;
            this.ogPlayedLengths = this.state.master.plays.slice();
            // calculate overall average
            let totalWatched = 0;
            let totalVolume = 0;
            master.plays.forEach(pl => {
                let itemWatched = 0;
                let itemVolume = 0;
                pl.forEach((l, idx) => {
                    if (idx === 0) {
                        itemVolume += Number(l.volume);
                    }
                    itemWatched += (l.end - l.start);
                });
                totalVolume += itemVolume;
                totalWatched += itemWatched;
            });
            this.averageVolume = master.plays.length ? ((totalVolume * 100) / master.plays.length) : 100;
            this.averageWatched = (totalWatched / master.plays.length);
            if (this.state.master.views) {
                session.percentViewedAllTime = (totalWatched) / (this.player.duration() * this.state.master.views) * 100;
            }
            this.setState({master, session});
            // listen for values added to database
            firebase.database().ref(this.videoId).on('value', (snapshot) => {
                const data = snapshot.val();
                if (!data || !data.plays) {return;}
                // calculate overall average
                let totalWatched = 0;
                let totalVolume = 0;
                data.plays.forEach(pl => {
                    let itemWatched = 0;
                    let itemVolume = 0;
                    pl.forEach((l, idx) => {
                        if (idx === 0) {
                            itemVolume += Number(l.volume);
                        }
                        itemWatched += (l.end - l.start);
                    });
                    totalVolume += itemVolume;
                    totalWatched += itemWatched;
                });
                this.averageVolume = ((totalVolume * 100) / data.plays.length);
                this.averageWatched = (totalWatched / data.plays.length);
                this.parseHeatmap(data.plays);
            });
        });
    }

    componentDidUpdate() {
        $('[data-toggle="tooltip"]').tooltip('hide').tooltip('fixTitle');
    }

    componentDidMount() {
        $('[data-toggle="tooltip"]').tooltip();        
        // instantiate video.js
        // other events: ['useractive', 'end']
        this.player = videojs(this.videoNode, this.props/*, this.onPlayerReady*/);
        // let session = _.extend({}, this.state.session);
        // session.volume = this.player.volume();
        // session.duration = this.player.duration();
        // this.setState({session});
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
            //TODO: what counts as a view?
            if (!this.started) {
                this.started = true;
                // add one to master views
                let totalCount = this.state.master.views;
                totalCount++;
                master.views = totalCount;
            }
            // // add one to master views
            // if (this.state.session.percentViewed === 100 && !this.completed) {
            //     this.completed = true;
            //     let totalCount = this.state.master.views;
            //     totalCount++;
            //     master.views = totalCount;
            //     // this.player.load();
            // }
            
            this.setState({
                session,
                master
            });

            this.saveToFirebase(master);
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
        session.volume = this.player.muted() ? 0: this.player.volume().toFixed(2);
        this.volumes.push(Number(session.volume));
        var total = 0;
        for(var i = 0; i < this.volumes.length; i++) {
            total += this.volumes[i];
        }
        if (this.player.paused()) {
            this.averageVolume = (total * 100) / this.volumes.length;
        }
        this.setState({session, master});
        // firebase.database().ref(`/${this.videoId}/volume`).set(this.state.session.volume);
    }

    saveToFirebase(data) {
        firebase.database().ref(this.videoId).set(data);
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
                userId: this.props.userId,
                volume: this.state.session.volume
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
        let masterPlayedLengths = this.ogPlayedLengths.slice();
        masterPlayedLengths.push(playedLengths);
        return {
            master: {
                runningTotal,
                plays: masterPlayedLengths
            },
            session: {
                currentTime: this.player.currentTime(),
                duration: this.player.duration(),
                percentLeft: (100 - (this.player.currentTime ()/ this.player.duration()) * 100).toFixed(2),
                percentViewed: (totalLength / this.player.duration()) * 100,
                playedListEls,
                totalLength,
                percentViewedAllTime: (runningTotal) / (this.player.duration() * this.state.master.views) * 100
            }
        };
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }

    toggleShowPlays() {
        if ($('.heatmap-container').hasClass('expand')) {
            $('.heatmap-container').removeClass('expand');
        } else {
            $('.heatmap-container').addClass('expand');
        }
    }

    toISOTime(seconds) {
        if (!_.isNumber(seconds) || isNaN(seconds)) {return;}
        let date = new Date(null);
        date.setSeconds(seconds);
        return date.toISOString().substr(11, 8);
    }

    // wrap the player in a div with a `data-vjs-player` attribute so videojs won't
    // create additional wrapper in the DOM see
    // https://github.com/videojs/video.js/pull/3856
    render() {
        $('[data-toggle="tooltip"]').tooltip('fixTitle').tooltip('show');                
        return (
            <div data-vjs-container>
                <div className="col-sm-12">
                    <h2 className="vid-title">{this.videoId}</h2>                        
                </div>
                <div className="col-sm-12">
                    <div data-vjs-player>
                        <video ref={node => this.videoNode = node} className="video-js"></video>
                    </div>
                </div>
                <div className="col-sm-12">
                    {/*Empty progress bar below*/}
                    {/*<h4 className="text-center">Current View Progress</h4>                    */}
                    <div className="progress pull-left played-vis-empty" data-toggle="tooltip" data-placement="bottom" title="This View">
                        <div className="progress-bar progress-bar-opaque" role="progressbar" style={{width: "100%"}}>
                        </div>
                    </div>
                    {/*video progress bars on top*/}
                    <div className="played-vis">
                        {this.state.session.playedListEls}
                    </div>
                </div>
                <div className="col-sm-12 overall-views"  data-toggle="tooltip" data-placement="top" title="All Views">
                    {/*<h4 className="text-center">All Time Views</h4>*/}
                    {this.heatmapEls}
                    {/*<button className="toggle-views" onClick={this.toggleShowPlays}>+</button>*/}
                </div>
                <div className="graphs-and-charts col-sm-12">
                    <div className="col-sm-6">
                        <div className="col-sm-12 panel panel-default text-center"
                        data-toggle="tooltip" data-placement="top"
                        title={`You\'ve watched ${this.state.session.percentViewed.toFixed(0)}% so far, 
                            pressed "Play" ${this.state.session.totalPlays} times, pressed "Pause" 
                            ${this.state.session.totalPauses} times, and have the volume set to ${(this.state.session.volume * 100).toFixed(0)}.`}>
                            <h4>This View</h4>
                            {/* percent viewed*/}
                            <div className="col-sm-4">
                                <h5>Viewed</h5>
                                <RadialProgress 
                                    percent={this.state.session.percentViewed.toFixed(0)} 
                                    title={`${this.state.session.percentViewed.toFixed(0)}%`} 
                                    color="green"
                                />
                            </div>
                            {/*percent skipped*/}
                            <div className="col-sm-4">
                                <h5>Unwatched</h5>
                                <RadialProgress 
                                    percent={100 - this.state.session.percentViewed.toFixed(0)}
                                    title={`${100 - this.state.session.percentViewed.toFixed(0)}%`}
                                    color="orange"
                                />      
                            </div>
                            {/*volume*/}
                            <div className="col-sm-4">
                                <h5>Volume</h5>
                                <RadialProgress
                                    percent={(this.state.session.volume * 100).toFixed(0)}
                                    color="blue"
                                />      
                            </div>
                            <div className="col-sm-12">
                                <ul className="list-group counts text-left">
                                    <li className="list-group-item">Plays: <span className="badge">{this.state.session.totalPlays}</span></li>
                                    <li className="list-group-item">Pauses: <span className="badge">{this.state.session.totalPauses}</span></li>
                                    <li className="list-group-item">Time viewed: <span className="label label-default pull-right">{this.toISOTime(this.state.session.totalLength)}</span></li>
                                </ul>
                            </div>
                        </div>  
                    </div>
                    <div className="col-sm-6">
                        <div className="panel panel-default col-sm-12 text-center"
                        data-toggle="tooltip" data-placement="top" 
                        title={`Of the ${this.state.master.views} total views, ${100 - this.state.session.percentViewedAllTime.toFixed(0)}% went unwatched.
                        The average view duration is ${this.toISOTime(this.averageWatched)}`}>
                            <h4>All Views</h4>
                            {/*percent watched all time*/}
                            <div className="col-sm-4">
                                <h5>Viewed</h5>
                                <RadialProgress 
                                    percent={this.state.session.percentViewedAllTime.toFixed(0)}
                                    title={`${this.state.session.percentViewedAllTime.toFixed(0)}%`}
                                    color="green"
                                />      
                            </div>
                            {/*percent skipped all-time*/}
                            <div className="col-sm-4">
                                <h5>Unwatched</h5>
                                <RadialProgress 
                                    percent={100 - this.state.session.percentViewedAllTime.toFixed(0)}
                                    title={`${100 - this.state.session.percentViewedAllTime.toFixed(0)}%`}
                                    color="orange"
                                />      
                            </div>
                          <div className="col-sm-4">
                                <h5>Volume</h5>
                                <RadialProgress
                                    percent={(this.averageVolume)}
                                    color="blue"
                                />      
                            </div>
                            <div className="col-sm-12">
                                <ul className="list-group counts text-left">
                                    <li className="list-group-item">Views: <span className="badge">{this.state.master.views}</span></li>
                                    <li className="list-group-item">All time played: <span className="label label-default pull-right">{this.toISOTime(this.state.master.runningTotal)}</span></li>
                                    <li className="list-group-item">Average view duration: <span className="label label-default pull-right">{this.toISOTime(this.averageWatched)} / {this.toISOTime(this.state.session.duration)}</span></li>
                                    {/*<li className="list-group-item">Average volume: <span className="label label-default pull-right">{this.averageVolume}</span></li>*/}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>             
            </div>
        )
    }
}

reactMixin(VideoPlayer.prototype, ReactFireMixin)

export default VideoPlayer;