const express = require("express");
const cors = require("cors");
const app = express();


app.use(express.json());

//CORS (Cross-Origin Resource Sharing) is a security feature implemented by web browsers that restricts web pages from making requests to a different domain than the one that served the web pag
app.use(cors());

const survivor = require("./routes/survivorRoutes");

app.use("/api/survivor/V1", survivor);


module.exports = app;