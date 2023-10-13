import config from "./config";

export default async function getSpecificFollower(user_id: string) {

    const req = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user_id}`, {
        headers: {
            "Authorization": "Bearer " + config.access_token,
            "Client-Id": config.client_id,
        }
    });
    const res = await req.json();
    
    return {
        total: res.total
    }

}