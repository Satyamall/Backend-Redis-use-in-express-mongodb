
const express = require("express");
const cors = require("cors");
const connect = require("./config/db");

const postController = require("./controllers/post.controller");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/posts",postController);

const start = async () =>{
    await connect();

    app.listen(5000,()=>{
        console.log("Listening on port 5000...");
    })
}

module.exports = start;
