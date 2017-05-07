const firebase = require('firebase');
const firebaseui = require('firebaseui');

export default class Auth {
    constructor(options) {
        const config = {
            apiKey: "AIzaSyA9-x6IUtpo7XTyzq9Ky_Hgt5qsc9oHJMk",
            authDomain: "vidstats-342ce.firebaseapp.com",
            databaseURL: "https://vidstats-342ce.firebaseio.com",
            projectId: "vidstats-342ce",
            storageBucket: "vidstats-342ce.appspot.com",
            messagingSenderId: "70798627814"
        };
        firebase.initializeApp(config);
        // FirebaseUI config.
        const uiConfig = {
            callbacks: {
                signInSuccess: (user) => {
                    var app = new window.Application({
                        userId: user.uid
                    });
                    return false;
                }
            },
            signInOptions: [
                firebase.auth.GithubAuthProvider.PROVIDER_ID,
                // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
                {
                    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                    // Whether the display name should be displayed in Sign Up page.
                    requireDisplayName: false
                }
            ],
            // Terms of service url.
            tosUrl: 'https://vidstats.netlify.com/tos'
        };
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                var app = new window.Application({
                    userId: user.uid
                });
                $('.logout').show();
                // // User is signed in.
                // var displayName = user.displayName;
                // var email = user.email;
                // var emailVerified = user.emailVerified;
                // var photoURL = user.photoURL;
                // var uid = user.uid;
                // var providerData = user.providerData;
                // user.getToken().then(function(accessToken) {
                //         document.write('Signed in');
                //         document.write('Sign out');
                //         document.write(JSON.stringify({
                //         displayName: displayName,
                //         email: email,
                //         emailVerified: emailVerified,
                //         photoURL: photoURL,
                //         uid: uid,
                //         accessToken: accessToken,
                //         providerData: providerData
                //     }, null, '  '))
                // });
            } else {
                // User is signed out.
                // Initialize the FirebaseUI Widget using Firebase.
                if (!this.ui) {
                    this.ui = new firebaseui.auth.AuthUI(firebase.auth());
                }
                $('.logout').hide();
                // The start method will wait until the DOM is loaded.
                this.ui.start('#firebase-auth-container', uiConfig);
                $('#video-container').empty();
            }
        }, function (error) {
            console.log(error);
        });
    }

    logout() {
        firebase.auth().signOut().then(function() {
            // window.location.reload();
            // Sign-out successful.
        }, function(error) {
            // window.location.reload();
            // An error happened.
        });
    }
}
