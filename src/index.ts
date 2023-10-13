import config from "./config";
import { getAccessToken } from "./auth";
import { getFollowers } from "./getAllFollowers";
import getSpecificFollower from "./getSpecificFollower";
import sortByFollowCount from "./sort";
import { redis } from "./lib/redis";

async function main() {


    // the steps are as follows for a fresh run:
    // 1. we first need to get all the followers, this does not tell us each followers follow count, but it tells us each followers name and userid
    // 2. we then need to get each followers follow count, we can do this by looping through each follower and getting their follow count
    // 3. we then need to sort the followers by their follow count

    // incase this script crashes, we save our progress to redis
    // if there is a key called "cursor" in redis, and there is no key "done-with-initial-set", then we know we are not done with step 1
    // if there is a key called "cursor" in redis, and there is a key "done-with-initial-set", then we know we are done with step 1
    // if there is a key called "index" in redis, then we know we are on step 2, if that key is < the followers hash length, then we know we are not done with step 2, so we can continue from where we left off
    // if there is a key called "index" in redis, and it is equal to the followers hash length, then we know we are done with step 2

    // connect redis
    await redis.connect();

    // get the redis keys
    const cursor = await redis.get("cursor");
    const index = await redis.get("index");
    const doneWithInitialSet = await redis.get("done-with-initial-set");

    // step 1 function will accept an undefined cursor parameter, so no matter cursor state, if the others are undefined, we can assume we are on step 1
    // this logic will only run if the script starts either for the first time or restarts after a crash
    if (cursor === null && index === null && doneWithInitialSet === null) {
        // we are on step 1
        console.log("We are on step 1");
        // run step 1
        await step1();
    } else if (cursor !== null && index === null && doneWithInitialSet === null) {
        // we are on step 1
        console.log("We are on step 1");
        // run step 1
        await step1(cursor);
    } else if (cursor !== null && index == null) {
        // we are on step 2
        console.log("We are on step 2, at the start");
        // run step 2
        await step2(0);
    } else if (cursor !== null && index !== null) {
        // we are on step 2
        console.log("We are on step 2, continuing from where we left off");
        // run step 2
        await step2(parseInt(index));
    }
    
    else {
        // something went wrong
        console.log("Something went wrong");
        console.log("cursor", cursor);
        console.log("index", index);
        console.log("doneWithInitialSet", doneWithInitialSet);
        return;
    }

    console.log("Done!");

}

async function step1(cursor?: string) {

    // get any followers we already have
    const followersString = await redis.get("followers");
    const followers = followersString ? JSON.parse(followersString) : {};

    const res = await getFollowers(cursor || undefined);

    if (res.success === false) {

        if (res.ratelimit) {
            // we are being rate limited, wait for the ratelimit to reset
            console.log(`Rate limited, waiting ${parseInt(res.ratelimit)} seconds...`);
            Bun.sleep(parseInt(res.ratelimit) * 1000);
        } else {
            // we are not being rate limited, but something else went wrong
            console.log("Something went wrong!");
            console.log(res.response);
            return;
        }

    } else {
        if (res.pagnationCursor) {
            // save the cursor to redis
            console.log("Saving cursor to redis...");
            await redis.set("cursor", res.pagnationCursor);

            // we are returned an array of followers, we need to add them to our followers object
            console.log("Adding followers to followers object...");
            for (const follower of res.followers) {
                followers[follower.user_id] = follower;
            }

            // save the followers object to redis
            console.log("Saving followers object to redis...");
            await redis.set("followers", JSON.stringify(followers));

            // run step 1 again
            await step1(res.pagnationCursor);
        } else {
            // we are done with step 1
            // we are not returned a cursor, so we we dont need to save a new one
            // we are returned an array of followers, we need to add them to our followers object
            console.log("Adding followers to followers object...");
            for (const follower of res.followers) {
                followers[follower.user_id] = follower;
            }

            // save the followers object to redis
            console.log("Saving followers object to redis...");
            await redis.set("followers", JSON.stringify(followers));

            // then save a key to redis to say we are done with step 1
            console.log("Saving done-with-initial-set to redis...");
            await redis.set("done-with-initial-set", "true");

            // run step 2
            await step2(0);
        }
    }

}

async function step2(index: number) {
    
    // first get the index from redis
    const indexString = await redis.get("index");
    const indexFromRedis = indexString ? parseInt(indexString) : 0;

    // if we are passed an index, we will use that, otherwise we will use the index from redis
    const currentIndex = index || indexFromRedis;

    // get the followers from redis
    const followersString = await redis.get("followers");
    const followers = followersString ? JSON.parse(followersString) : {};

    // get the follower ids
    const followerIds = Object.keys(followers);

    // loop through each follower starting at the index, and get their follow count
    for (let i = currentIndex; i < followerIds.length; i++) {
        console.log(`Getting follow count for follower ${i + 1} of ${followerIds.length}`);
        const followerId = followerIds[i];
        const follower = followers[followerId];

        // get the follow count
        const followCount = await getSpecificFollower(followerId);

        // add the follow count to the follower object
        follower.follow_count = followCount.total;

        console.log(`Saving follower ${i + 1} of ${followerIds.length} to redis...`);
        // save the follower object to redis
        await redis.set("followers", JSON.stringify(followers));

        console.log(`Saving index to redis...`);
        // save the index to redis
        await redis.set("index", i.toString());
    }

    // we are done with step 2, step 3 will happen later
}

main()