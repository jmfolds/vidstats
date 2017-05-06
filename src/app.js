import 'bootstrap-sass/assets/javascripts/bootstrap.js';
import template from './app.html';
require("video.js/dist/video-js.css");
const firebase = require('firebase');
const firebaseui = require('firebaseui');
import React from 'react';
import VideoPlayer from './Components/Player/Player.jsx';
import { render } from 'react-dom';
require("./app.scss");

 var config = {
        apiKey: "AIzaSyA9-x6IUtpo7XTyzq9Ky_Hgt5qsc9oHJMk",
        authDomain: "vidstats-342ce.firebaseapp.com",
        databaseURL: "https://vidstats-342ce.firebaseio.com",
        projectId: "vidstats-342ce",
        storageBucket: "vidstats-342ce.appspot.com",
        messagingSenderId: "70798627814"
    };
    firebase.initializeApp(config);
    // FirebaseUI config.
      var uiConfig = {
          callbacks: {
            signInSuccess: () => { 
                var app = new window.app({
                    test: 'options'
                });
                return false; 
            }
          },
        signInOptions: [
          // Leave the lines as is for the providers you want to offer your users.
          firebase.auth.GithubAuthProvider.PROVIDER_ID
        ],
        // Terms of service url.
        tosUrl: 'https://vidstats.netlify.com/tos'
      };
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
        var app = new window.app({
            test: 'options'
        });
        // // User is signed in.
        // var displayName = user.displayName;
        // var email = user.email;
        // var emailVerified = user.emailVerified;
        // var photoURL = user.photoURL;
        // var uid = user.uid;
        // var providerData = user.providerData;
        // user.getToken().then(function(accessToken) {
        //     document.write('Signed in');
        //     document.write('Sign out');
        //     document.write(JSON.stringify({
        //     displayName: displayName,
        //     email: email,
        //     emailVerified: emailVerified,
        //     photoURL: photoURL,
        //     uid: uid,
        //     accessToken: accessToken,
        //     providerData: providerData
        //     }, null, '  '))
        // });
        } else {
            // User is signed out.
            // Initialize the FirebaseUI Widget using Firebase.
            var ui = new firebaseui.auth.AuthUI(firebase.auth());
            // The start method will wait until the DOM is loaded.
            ui.start('#firebase-auth-container', uiConfig);
        }
    }, function(error) {
        console.log(error);
    });


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
        const index = Math.floor(Math.random()*videos.length);
        const videoOpts = {
            aspectRatio: '16:5',
            autoplay: false,
            controls: true,
            sources: [videos[index]]
        }
        this.PlayerView = render(
            <VideoPlayer { ...videoOpts} />,
            document.getElementById('video-container')
        );
        console.info('App started with these options:', opts);
    }
}

window.app = application;

module.exports = application;
