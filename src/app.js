import 'bootstrap-sass/assets/javascripts/bootstrap.js';
import template from './app.html';
require("video.js/dist/video-js.css");
import FirebaseAuth from './Components/Auth/auth.js';
import React from 'react';
import VideoPlayer from './Components/Player/Player.jsx';
import {
    render
} from 'react-dom';
require("./app.scss");

const auth = new FirebaseAuth();
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

class Application {
    constructor(options) {
        this.options = options || {};
        const index = Math.floor(Math.random() * videos.length);
        const videoOpts = {
            aspectRatio: '16:5',
            autoplay: false,
            controls: true,
            sources: [videos[index]]
        }
        this.PlayerView = render( <
            VideoPlayer { ...videoOpts } userId={this.options.userId} />,
            document.getElementById('video-container')
        );

        $('.logout').on('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }
}

window.Application = Application;

module.exports = Application;