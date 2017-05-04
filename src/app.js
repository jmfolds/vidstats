import 'bootstrap-sass/assets/javascripts/bootstrap.js';
import template from './app.html';
require("video.js/dist/video-js.css");
import React from 'react';
import VideoPlayer from './Components/Player/Player.js';
import { render } from 'react-dom';
require("./app.scss");
const videos = [
    {
        src: './data/doberman-kitten.mp4',
        type: 'video/mp4'
    },
    {
        src: './data/oops.mp4',
        type: 'video/mp4'
    },
    {
        src: './data/hungry-cat.mp4',
        type: 'video/mp4'
    },
    {
        src: './data/rabbit.mp4',
        type: 'video/mp4'
    },
    {
        src: './data/oceans.mp4',
        type: 'video/mp4'
    }
];
class application {
    constructor(opts) {
        const videoOpts = {
            aspectRatio: '16:8',
            autoplay: false,
            controls: true,
            sources: [videos[Math.floor(Math.random()*videos.length)]]
        }
        this.PlayerView = render(
            <VideoPlayer  { ...videoOpts} />,
            document.getElementById('video-container')
        );
        console.info('App started with these options:', opts);
    }
}

window.app = application;

module.exports = application;
