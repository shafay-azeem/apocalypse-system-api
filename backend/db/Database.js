const mongoose = require("mongoose");


const connectDataBase = () => {
    // Using the connect method of the mongoose library to connect to the database using the DB_URL environment variable
    mongoose.connect(process.env.DB_URL).then((data) => {
        console.log(`mongo db is connected with server:${data.connection.host}`);
    }).catch(err => {
        // If an error occurs during the connection process, logging the error
        console.log(err)
    });
};
module.exports = connectDataBase;