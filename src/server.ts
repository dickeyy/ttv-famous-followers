import config from "./config";

const server = Bun.serve({
    port: 3000,
    fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/") {

            // Redirect to Twitch login page
            const redirect_uri = config.oauth_url;

            // redirect the user
            return Response.redirect(redirect_uri, 302);

        } else if (url.pathname === "/callback") {
            const params = url.searchParams;

            const code = params.get("code");

            console.log("Code: " + code);

            return new Response(`success! code: ${code}`);
        }

        return new Response("404!");
    },  
});
  
console.log(`Listening on localhost: ${server.port}`);