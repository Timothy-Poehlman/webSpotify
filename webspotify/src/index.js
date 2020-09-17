import React from 'react';
import ReactDOM from 'react-dom';
import response from 'react';
import { SpotifyApiContext } from 'react-spotify-api';
import './index.css';

const clientID = ""

const element = <h1>test</h1>;

//sets the clock
class tick extends React.Component {
    render() {
        const clock = (
            <div>
                Current Time: {new Date().toLocaleTimeString()}
            </div>
        );
        ReactDOM.render(
            clock, 
            document.getElementById('clock')
        );
    }
}
setInterval(tick, 1000);

//SPOTIFY




//full render of body
ReactDOM.render(
    element,
    document.getElementById('root')
);