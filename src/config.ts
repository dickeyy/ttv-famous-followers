const config = {
    client_id: process.env.TWITCH_CLIENT_ID as string,
    client_secret: process.env.TWITCH_CLIENT_SECRET as string,
    access_token: process.env.TWITCH_ACCESS_TOKEN as string,
    app_access_token: process.env.TWITCH_APP_ACCESS_TOKEN as string,
    auth_code: process.env.TWITCH_AUTH_CODE as string,
    token_type: process.env.TWITCH_TOKEN_TYPE as string,
    oauth_url: `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_REDIRECT_URI}&response_type=code&scope=${process.env.TWITCH_SCOPES}`,

    broadcaster_id: "225845758",

    redis_host: process.env.REDIS_HOST as string,
    redis_port: process.env.REDIS_PORT as string,  
    redis_password: process.env.REDIS_PASSWORD as string,  
}

export default config;