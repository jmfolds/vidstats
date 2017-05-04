import 'bootstrap-sass/assets/javascripts/bootstrap.js';
import template from './app.html';
require("video.js/dist/video-js.css");
import React from 'react';
import VideoPlayer from './Components/Player/Player.js';
import { render } from 'react-dom';
require("./app.scss");

class application {
    constructor(opts) {
        const videoOpts = {
            fluid: true,
            autoplay: false,
            controls: true,
            sources: [
                {
                    src: 'http://vjs.zencdn.net/v/oceans.mp4',
                    type: 'video/mp4'
                },
                {
                    src: './data/oops.mp4',
                    type: 'video/mp4'
                }
            ]
        }
        this.PlayerView = render(
            <VideoPlayer  { ...videoOpts} />,
            document.getElementById('video-container')
        );
        // this.rootView = document.getElementById('app-container').innerHTML = template;
        // this.mapView = new MapView(opts);


// return <VideoPlayer { ...videoJsOptions } />
//         this.player = new VideoPlayer();
        console.info('App started with these options:', opts);
        // var options = {};
        
        // var player = videojs('bb-vid', options, function onPlayerReady() {
        // videojs.log('Your player is ready!');
        
        // // In this context, `this` is the player that was created by Video.js. 
        // this.play();
        
        // // How about an event listener? 
        // this.on('ended', function() {
        //     videojs.log('Awww...over so soon?!');
        // });
        // });
    }
}

window.app = application;

module.exports = application;
