
const redis = require("redis");
const client = redis.createClient();

client.on('error', (error) => {
    console.log('Redis Client Error', error);
});

module.exports = client;

