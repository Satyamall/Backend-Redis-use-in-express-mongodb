
const express = require("express");
const client = require("../config/redis");
const router = express.Router();

const Post = require("../models/post.model");

router.post("/", async (req,res)=>{
    try{
        const post = await Post.create(req.body);

        return res.status(201).json({status: "success", data: post});
    }
    catch(err){
        return res.status(500).json({status: "failed", message: err.message})
    }
})

router.get("/", async (req,res)=>{
    const page = +req.query.page || 1;
    const size = +req.query.size || 10;

    // First we will check if redis has the data
    client.get(`posts.${page}.${size}`, async (err,posts)=>{
        if(err) return res.status(500).json({status:"failed", message: err.message});

        // If yes then serve that
        if(posts) return res.status(201).json({status: "success", posts: JSON.parse(posts)});

        try{
             const offset = (page-1)*size;
            // If not then fetch from the database
            const posts = await Post.find({}).skip(offset).limit(size).lean().exec();
    
            // Then Save it in redis
            client.set(`posts.${page}.${size}`, JSON.stringify(posts));
    
            // Then return that data
            res.status(200).json({status: "success", posts});
        }
        catch(err){
            return res.status(500).json({status:"failed", message: err.message});
        }
    });

});

router.post("/:userId/:postId/like", async (req,res)=>{
   const userId= req.params.userId;
   const postId=req.params.postId;

   // first check if the key for userid.postid.like exists
   client.get(`${userId}.${postId}.like`, (err, hasLiked)=>{
       if(err) return res.status(500).json({status: "failed", message: err.message});

       if(hasLiked === "true"){
           // if yes and if the value of it is "true" then you change it to "false"
           client.set(`${userId}.${postId}.like`, false);

           // if I changed it from true to false then decrement the count of all likes by 1
           client.decr(`${postId}.likes`);
           return res.status(200).json({status:"success", message: "you have successfully disliked the post"})
       }
       else{
           // else the value of it is "false" then you change it to "true"
           client.set(`${userId}.${postId}.like`, true);
           
           // increment the count of all likes by 1
           client.incr(`${postId}.likes`);

           return res.status(200).json({
               status: "success",
               message: "you have successfully liked the post",
           });
       }
   })
})

module.exports = router;