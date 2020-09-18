import React from 'react';
import ReactDOM from 'react-dom';
import App, * as application from './App.js';

function clock(){
    ReactDOM.render(<application.Clock />, document.getElementById('clock'));
}

setInterval(clock, 1000);

//full render of body
ReactDOM.render(
    <App />,
    document.getElementById('root')
);

