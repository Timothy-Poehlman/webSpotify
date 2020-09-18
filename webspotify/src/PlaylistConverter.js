// Made by Timothy Poehlman
import React from "react";
import { useForm, useField, splitFormProps } from 'react-form';
import axios from 'axios';


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
    return url.match(regExp)&&url.match(regExp).length>0;
}

/*
    Description: Retrieves a list of names of every video in the playlist
*/
function getPlaylist(link)
{
    console.log("Getting Playlist from Youtube");
    var reg = new RegExp("[&?]list=([a-z0-9_-]+)","i");
    var match = reg.exec(link);
    var id;
    var data = [];

    if (match&&match[1].length>0&&validate(link)){
        id = match[1];
    }else{
        return "could not find id";
    }

    axios.get('https://www.googleapis.com/youtube/v3/playlistItems?playlistId=' + id + '&part=snippet')
        .then(res => {
            data = res.data;
        })

    console.log(data.title);
}

/*
    Description: asks user if they want to create a new one or add it to an existing one
*/
function checkType(playlist)
{

}

/*
    Description: adds the playlist to the given playlist name, if it does not exist create a new one
*/
function giveToSpotify(playlist, playlistName)
{

}

export default function PlaylistLinkForm() {
    const {
        Form,
        meta: { isSubmitting, canSubmit }
    } = useForm({
        onSubmit: async (values, instance) => {
            //send values to getPlaylist, once names are retrieved send info to giveToSpotify to convert
            console.log(values);
            await checkType(getPlaylist(values.playlistLink));
            console.log("Converted!");
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
                </Form>
            </div>
        </div>
    );
}