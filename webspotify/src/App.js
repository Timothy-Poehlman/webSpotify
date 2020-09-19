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
    "playlist-modify",
    "playlist-modify-private",
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
            device: "None",
            no_data: false,
            user_id: null,
            userPlaylists: [],
            userPlaylistsIds: [],
        };
        this.getCurrentlyPlaying = this.getCurrentlyPlaying.bind(this);
        this.getUserInfo = this.getUserInfo.bind(this);
        this.getUserPlaylists = this.getUserPlaylists.bind(this);
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
            this.getUserInfo(_token);
            this.getUserPlaylists(this.state.user_id,_token)
        }
        this.interval = setInterval(() => this.tick(), 5000);
    }

    getUserInfo(token) {
        $.ajax({
            url: "https://api.spotify.com/v1/me",
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
                if(!data) {
                    console.log("No data found!");
                }
                else{
                    this.setState({
                        user_id: data.id,
                    });
                }
            }
        });
    }

    //gets a list of playlist data of all of the users playlists (Spotify)
    getUserPlaylists(userId, token) {
        $.ajax({
            url: "https://api.spotify.com/v1/users/" + userId + '/playlists',
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
                var playlist = [];
                var playlistIds = [];
                for(var i=0;i<data.items.length;i++)
                {
                    playlistIds.push(data.items[i].id);
                    playlist.push(data.items[i].name);
                }
                playlist.push("Create New Playlist");
                playlistIds.push("newPlaylist");
                this.setState({
                    userPlaylists: playlist,
                    userPlaylistsIds: playlistIds,
                });
            }
        });
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
                if(!data) {
                    this.setState({
                        no_data: true,
                    });
                }
                else{
                    this.setState({
                        item: data.item,
                        is_playing: data.is_playing,
                        progress_ms: data.progress_ms,
                        device: data.device.name,
                        no_data: false,
                    });
                }
            }
        });
    }

    tick() {
        if (this.state.token) {
            this.getCurrentlyPlaying(this.state.token);
            this.getUserInfo(this.state.token);
            this.getUserPlaylists(this.state.user_id,this.state.token);
            console.log(this.state.playlistIds);
            console.log("Got Data");
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
                        <PlaylistLinkForm
                            user_id={this.state.user_id}
                            userPlaylists={this.state.userPlaylists}
                            playlistIds={this.state.userPlaylistsIds}
                            token={this.state.token}
                        />
                    )}
                </header>
            </div>
        );
    }
}