import config from "./config";

async function getBroadcaster(broadcasterName: string) {

    const req = await fetch(`https://api.twitch.tv/helix/users?login=${broadcasterName}`, {
        headers: {
            "Authorization": "Bearer " + config.access_token,
            "Client-Id": config.client_id,
        }
    })

    const res = await req.json();

    return res;

}

async function getAccessToken() {

    const req = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${config.client_id}&client_secret=${config.client_secret}&code=${config.auth_code}&grant_type=authorization_code&redirect_uri=${process.env.TWITCH_REDIRECT_URI}`, {
        method: "POST"
    })

    const res = await req.json();

    return res;

}

async function refreshAccessToken(refreshToken: string) {

    // get a new access token using the refresh token
    const req = await fetch(`https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${config.client_id}&client_secret=${config.client_secret}`, {
        method: "POST"
    });

    const res = await req.json();

    return res;

}

export {
    getBroadcaster,
    getAccessToken,
    refreshAccessToken
}