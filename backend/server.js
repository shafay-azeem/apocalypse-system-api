const express = require("express");
const dotenv = require("dotenv");

const connectDataBase = require("./db/Database");
const app = require("./app");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

dotenv.config({ path: "backend/.env" });

connectDataBase();

app.use(notFound); //wrong end point err
app.use(errorHandler); //all other errors

const server = app.listen(process.env.PORT, () => {
    console.log(`server is running on ${process.env.PORT}`);
});