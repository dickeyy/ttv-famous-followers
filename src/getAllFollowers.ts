import config from "./config";

async function getFollowers(pagnationCursor?: string) {

    console.log("Getting followers...");

    const req = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${config.broadcaster_id}${pagnationCursor !== undefined ? "&after=" + pagnationCursor : ""}`, {
        headers: {
            "Authorization": "Bearer " + config.access_token,
            "Client-Id": config.client_id,
        }
    })

    if (req.status === 429) {
        // we are being rate limited, 
        // get the Ratelimit-Reset header
        const reset = req.headers.get("Ratelimit-Reset");
        return {
            success: false,
            ratelimit: reset
        };
    } else if (req.ok === false) {
        return {
            success: false,
            response: req
        };
    }

    const res = await req.json();

    const followers = res.data;
    const cursor = res.pagination.cursor;

    // return the followers and the cursor
    return {
        success: true,
        followers,
        pagnationCursor: cursor
    }

}

// run the getFollowers function, if we are returned a cursor, run the function again with the cursor
let totalFollowers = 0;
async function runGetFollowers(cursor?: string) {

    // make a recursive function to get all the followers
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

    }

    totalFollowers += res.followers.length;

    // run the function again if we have a cursor
    if (res.pagnationCursor) {
        await runGetFollowers(res.pagnationCursor);
    } else {
        console.log(`Total followers: ${totalFollowers}`);
        return {
            success: true,
            total: totalFollowers
        }
    }

    return {
        success: true,
        total: totalFollowers
    }

}

export {
    runGetFollowers,
    getFollowers
}