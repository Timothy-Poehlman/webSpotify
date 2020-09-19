/*
    Made by Timothy Poehlman w/ help from a tutorial by Joe Karlsson (react-spotify-player)
*/

import React from 'react';
import Player from './Player.js';
import hash from "./hash";
import logo from './logo192.png';
import axios from 'axios';
import * as $ from 'jquery';
import './index.css';
export const authEndpoint = 'https://accounts.spotify.com/authorize?';

const clientId = process.env.REACT_APP_SPOTIFYCLIENTID;
const youtubeKey = process.env.REACT_APP_YOUTUBEKEY;
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
            playlistUris: [],
            //input stuff
            playlistLink: null,
            playlistReName: null,
            playlistName: null,
        };
        this.getCurrentlyPlaying = this.getCurrentlyPlaying.bind(this);
        this.getUserInfo = this.getUserInfo.bind(this);
        this.getUserPlaylists = this.getUserPlaylists.bind(this);
        this.tick = this.tick.bind(this);
        this.validate = this.validate.bind(this);
        this.giveToSpotify = this.giveToSpotify.bind(this);
        this.getPlaylist = this.getPlaylist.bind(this);
        this.createSpotifyPlaylist = this.createSpotifyPlaylist.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.submitPlaylistInfo = this.submitPlaylistInfo.bind(this);
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

    /*
        validates that a url is from youtube
    */
    validate(url) {
        var regExp = /^(?:https?:\/\/)?(?:www\.)?youtube\.com(?:\S+)?$/;
        return url.match(regExp) && url.match(regExp).length > 0;
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

    /*
        Description: adds the playlist to the given playlist name, if it does not exist create a new one
        parameters: playlist: an array of video info
                    playlistname: name of playlist that this will be added to in spotify
    */
    async giveToSpotify(youtubePlaylist, playlistName, playlistId, userId, token) {
        var playlist = [];
    
        //convert youtube list to best fitting spotify playlist song names - for now it just searches the title, but later we can try to extract the name of the artist
        for (var i = 0; i < youtubePlaylist.length; i++) {
            $.ajax({
                url: "https://api.spotify.com/v1/search",
                type: "GET",
                data: JSON.stringify({q:youtubePlaylist[i].snippet.title, type:"track"}),
                beforeSend: (xhr) => {
                    xhr.setRequestHeader("Authorization", "Bearer " + token);
                },
                error: function (response) {
                    alert(response.statusText);
                    console.log(response.statusText);
                    console.log("failed");
                },
                success: (data) => {
                    if(data.length == 0)
                    {
                        this.setState({
                            playlistUri: this.state.playlistUris.push(data.tracks.items[0].uri),
                        });
                    }
                    else{console.log("Could not find song");}
                }
            });
        }
        console.log(playlist);
    
    
    
    
        //create new playlist if requested
        var playlist_id = playlistId;
        if(playlistId == "newPlaylist")
        {
            playlist_id = await this.createSpotifyPlaylist(userId, playlistName, token);
            playlist_id = playlist_id.id;
        }
        console.log(playlist_id);
        //adds songs to the playlist
        var songUris;
        //construct uri, should be in format: uri1,uri2,uri3,...
        for (var i = 0; i < playlist.length; i++) {
            songUris = songUris + ',' + playlist.pop();
        }
    
        await $.ajax({
            url: "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks",
            type: "POST",
            data: JSON.stringify({uris:songUris}),
            beforeSend: (xhr) => {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
            },
            error: function (response) {
                alert(response.statusText);
                console.log(response.statusText);
                console.log("failed");
            },
            success: (data) => {
                if(data)
                {
                    console.log(data.tracks.items);
                    return data.tracks.items[0].uri;
                }
                else{console.log("Could not find song");}
            }
        })
    }

    /*
        Description: Retrieves a list of names of every video in the playlist
    */
    async getPlaylist(link) {
        console.log("Getting Playlist from Youtube");
        var reg = new RegExp("[&?]list=([a-z0-9_-]+)", "i");
        var match = reg.exec(link);
        var id;
        var data = [];

        if (match && match[1].length > 0 && this.validate(link)) {
            id = match[1];
        } else {
            return "could not find id";
        }

        //needs to be await for the promise to be fulfilled
        data = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems?playlistId=' + id + '&maxResults=50&part=snippet&key=' + youtubeKey)
            .then((response) => {
                console.log(response.data.items);
                return response.data.items;
            }, (error) => {
                console.log(error);
            });

        console.log("title: " + data[0].snippet.title);

        return data;

    }

    async createSpotifyPlaylist(userId, name, token)
    {
        return await $.ajax({
            url: "https://api.spotify.com/v1/users/" + userId + '/playlists',
            type: "POST",
            data: JSON.stringify({name: name,}),
            beforeSend: (xhr) => {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
            },
            error: function (response) {
                alert(response.statusText);
                console.log(response.statusText);
                console.log("failed");
            },
            success: (data) => {
                console.log(data.id);
                return data.id;
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

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value,
        })
    }
    
    async submitPlaylistInfo() {
        alert('Inputs were submitted');
        //send values to getPlaylist, once names are retrieved send info to giveToSpotify to convert
        var playlist = await this.getPlaylist(this.state.playlistLink);
        console.log("Got Playlist!");
        //find corresponding id
        var index;
        for(var i=0;i<this.state.userPlaylists.length;i++)
        {
            if(this.state.playlistName == this.state.userPlaylists[i]){index=i;break;}
        }
        this.giveToSpotify(playlist, this.state.playlistReName, this.state.playlistIds[index], this.state.user_id, this.state.token)
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
                        <div className="App">
                            <div className="main-wrapper">
                                <form>
                                    <div>
                                        <label>
                                            Youtube Playlist Link: 
                                            <input type="text" name="playlistLink" value={this.state.value} onChange={this.handleChange} />
                                        </label>
                                    </div>
                                    <div id="playlistNameInput">
                                        <label>
                                            Spotify Playlist Name (Only Required if creating a new Playlist):
                                            <input type="text" name="playlistReName" value={this.state.value} onChange={this.handleChange} />
                                        </label>
                                        <select name="playlistName" value={this.state.value} onChange={this.handleChange}>
                                            Choose Playlist:{" "}
                                            {this.state.userPlaylists.map((name)=> {
                                                return <option value={name}>{name}</option>
                                            })}
                                        </select>
                                    </div>
                                </form>
                                <div>
                                    <button name="submitButton" onClick={() => this.submitPlaylistInfo()}>SUBMIT</button>
                                </div>
                            </div>
                        </div>
                    )}
                </header>
            </div>
        );
    }
}