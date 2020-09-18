/*
    Made by Timothy Poehlman w/ help from a tutorial by Joe Karlsson (react-spotify-player)
*/

import React from 'react';
import Player from './Player.js';
import PlaylistLinkForm from './PlaylistConverter.js';
import hash from "./hash";
import logo from './logo192.png';
import * as $ from 'jquery';
import './index.css';

export const authEndpoint = 'https://accounts.spotify.com/authorize?';

const clientId = process.env.REACT_APP_SPOTIFYCLIENTID;
const redirectUri = "http://localhost:3000";
const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
];

//sets the clock
export class Clock extends React.Component {
    render() {
        return (
            <div>
                Current Time: {new Date().toLocaleTimeString()}
            </div>
        );
    }
}

//SPOTIFY - this portion contains elements from Joe Karlsson
export default class App extends React.Component {
    constructor() {
        super();
        this.state = {
            token: null,
            item: {
                album: {
                    images: [{ url: "" }]
                },
                name: "",
                artists: [{ name: "" }],
                duration_ms: 0,
            },
            is_playing: "Paused",
            progress_ms: 0,
            device: "None"
        };
        this.getCurrentlyPlaying = this.getCurrentlyPlaying.bind(this);
        this.tick = this.tick.bind(this);
    }

    componentDidMount() {
        // Set token
        let _token = hash.access_token;
        if (_token) {
            // Set token
            this.setState({
                token: _token
            });
            this.getCurrentlyPlaying(_token);
        }
        this.interval = setInterval(() => this.tick(), 3000);
    }

    //use this format for all of the api info
    getCurrentlyPlaying(token) {
        // Make a call using the token
        $.ajax({
            url: "https://api.spotify.com/v1/me/player",
            type: "GET",
            beforeSend: (xhr) => {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
            },
            error: function (response) {
                alert(response.statusText);
                console.log(response.statusText);
                console.log("failed");
            },
            success: (data) => {
                this.setState({
                    item: data.item,
                    is_playing: data.is_playing,
                    progress_ms: data.progress_ms,
                    device: data.device.name,
                });
                console.log("Got Data");
            }
        });
    }

    tick() {
        console.log("tick");
        if (this.state.token) {
            this.getCurrentlyPlaying(this.state.token);
        }
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    {/* Login + Current song */}
                    {!this.state.token && (
                        <a className="btn btn--loginApp-link" href={`${authEndpoint}client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`}>
                            Login to Spotify
                        </a>
                    )}
                    {this.state.token && (
                        <Player
                            item={this.state.item}
                            is_playing={this.state.is_playing}
                            progress_ms={this.progress_ms}
                            device={this.state.device}
                        />
                    )}

                    {/* Youtube -> Spotify playlist conversion */}
                    {this.state.token && (
                        <PlaylistLinkForm/>
                    )}
                </header>
            </div>
        );
    }
}