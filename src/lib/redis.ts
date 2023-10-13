import { createClient, RedisClientOptions } from "redis";
import config from "../config";

const redisOptions: RedisClientOptions = {
    socket: {
        host: config.redis_host,
        port: parseInt(config.redis_port as string),
    },
    password: config.redis_password,
}

const redis = createClient(redisOptions);

redis.on("error", (error) => {
    console.error(error);
});

redis.once("ready", () => {
    console.log("Redis is ready!");
});

// export the redis client
export { redis };
