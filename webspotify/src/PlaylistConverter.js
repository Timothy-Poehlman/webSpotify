// Made by Timothy Poehlman
import React from "react";
import { useForm, useField, splitFormProps } from 'react-form';
import axios from 'axios';
import * as $ from 'jquery';


const youtubeKey = process.env.REACT_APP_YOUTUBEKEY;

// from React Form- Basic Form example by tannerlinsley
const InputField = React.forwardRef((props, ref) => {
    // Let's use splitFormProps to get form-specific props
    const [field, fieldOptions, rest] = splitFormProps(props);

    // Use the useField hook with a field and field options
    // to access field state
    const {
        meta: { error, isTouched, isValidating },
        getInputProps
    } = useField(field, fieldOptions);

    // Build the field
    return (
        <>
            <input {...getInputProps({ ref, ...rest })} />{" "}
            {isValidating ? (
                <em>Validating...</em>
            ) : isTouched && error ? (
                <em>{error}</em>
            ) : null}
        </>
    );
});
//

/*
    validates that a url is from youtube
*/
function validate(url) {
    var regExp = /^(?:https?:\/\/)?(?:www\.)?youtube\.com(?:\S+)?$/;
    return url.match(regExp) && url.match(regExp).length > 0;
}

/*
    Description: Retrieves a list of names of every video in the playlist
*/
async function getPlaylist(link) {
    console.log("Getting Playlist from Youtube");
    var reg = new RegExp("[&?]list=([a-z0-9_-]+)", "i");
    var match = reg.exec(link);
    var id;
    var data = [];

    if (match && match[1].length > 0 && validate(link)) {
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

async function createSpotifyPlaylist(userId, name, token)
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

/*
    Description: adds the playlist to the given playlist name, if it does not exist create a new one
    parameters: playlist: an array of video info
                playlistname: name of playlist that this will be added to in spotify
                exists: whether the playlist exists or if we will create a new one
*/
async function giveToSpotify(youtubePlaylist, playlistName, playlistId, userId, token) {
    var playlist = [];

    //convert youtube list to best fitting spotify playlist song names - for now it just searches the title, but later we can try to extract the name of the artist
    for (var i = 0; i < youtubePlaylist.length; i++) {
        playlist.push(
            await $.ajax({
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
                        console.log(data.tracks.items);
                        return data.tracks.items[0].uri;
                    }
                    else{console.log("Could not find song");}
                }
            })
        );
    }
    console.log(playlist);




    //create new playlist if requested
    var playlist_id = playlistId;
    if(playlistId == "newPlaylist")
    {
        playlist_id = await createSpotifyPlaylist(userId, playlistName, token);
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

function MultiSelectField(props) {
    const [field, fieldOptions, { options, ...rest }] = splitFormProps(props);

    const {
        value = [],
        setValue,
        meta: { isTouched, error }
    } = useField(field, fieldOptions);

    const handleSelectChange = e => {
        const selected = Array.from(e.target.options)
            .filter(option => option.selected)
            .map(option => option.value);

        setValue(selected);
    };

    return (
        <>
            <select {...rest} value={value} onChange={handleSelectChange} multiple>
                <option disabled value="" />
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            {isTouched && error ? <em>{error}</em> : null}
        </>
    );
}

function PlaylistLinkForm(props) {
    console.log(props.playlistIds);
    const {
        Form,
        meta: { isSubmitting, canSubmit }
    } = useForm({
        onSubmit: async (values, instance) => {
            //send values to getPlaylist, once names are retrieved send info to giveToSpotify to convert
            console.log(values);
            var playlist = await getPlaylist(values.playlistLink);
            console.log("Got Playlist!");
            //find corresponding id
            var index;
            for(var i=0;i<props.userPlaylists.length;i++)
            {
                if(values.playlistName == props.userPlaylists[i]){index=i;break;}
            }
            giveToSpotify(playlist, values.playlistReName, props.playlistIds[index], props.user_id, props.token)
        }
    })
    return (
        <div className="App">
            <div className="main-wrapper">
                <Form>
                    <div>
                        <label>
                            Youtube Playlist Link: <InputField field="playlistLink" validate={value => (!value ? "Required" : false)} />
                        </label>
                    </div>
                    <div id="playlistNameInput">
                        <label>
                            Spotify Playlist Name (Only Required if creating a new Playlist): <InputField field="playlistReName" validate={value => (!value ? "Required" : false)} />
                        </label>
                        <label>
                            Choose Playlist:{" "}
                            <MultiSelectField
                                field="playlistName"
                                options={
                                    props.userPlaylists
                                }
                                validate={value => (!value ? "Required" : false)}
                            />
                        </label>
                    </div>
                    <div>
                        <button type="submit" disabled={!canSubmit}>
                            Submit
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}

export default PlaylistLinkForm;