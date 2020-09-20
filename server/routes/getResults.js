const $ = require('jquery');
const express = require("express");
const router = express.Router();
let results = require("../searchResults");

//convert youtube list to best fitting spotify playlist song names - for now it just searches the title, but later we can try to extract the name of the artist
router.get("/searchSpotify", async (req, res) => {
    try {
        let playlistUri = [];
        let youtubePlaylist = req.body;        
        console.log(req.body);
        let {token} = req.params['token'];
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
                        playlistUri.push(data.tracks.items[0].uri)
                    }
                    else{console.log("Could not find song");}
                }
            });
        res.status(200).json({
            data: playlistUri,
        })
        }
    } catch (err) {
        res.status(400).json({
            message: "Some error occured",
            err
        });
    }
});

router.get("/test", async (req, res) => {
    res.send(console.log("test recieved at db?"))
})

module.exports = router;