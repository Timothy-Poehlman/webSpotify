//server stuff https://www.techomoro.com/how-to-create-a-react-frontend-express-backend-and-connect-them-together/
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const port = process.env.PORT || 3001;

app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//routes
const getResults = require("./routes/getResults");
app.use("/searchSpotify", getResults);

app.listen(port, function() {
    console.log("Runnning on " + port);
});

module.exports = app;