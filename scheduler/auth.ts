import { google } from 'googleapis';

import Config from "./config.ts";
const config = new Config().get();

const auth = new google.auth.OAuth2({
	clientId: config.google.client.id,
	clientSecret: config.google.client.secret,
	redirectUri: 'http://localhost:8000/',
});

if (config.google.tokens?.refresh) auth.setCredentials({ refresh_token: config.google.tokens.refresh });
export default auth;

if (import.meta.main) {
	const url = auth.generateAuthUrl({
		access_type: 'offline',
		scope: [
			'https://www.googleapis.com/auth/youtube',
			'https://www.googleapis.com/auth/youtube.force-ssl',
		]
	})

	console.log(`Visit the following URL to authorize: \n${url}\n`);

	Deno.serve(async req => {
		const url = new URL(req.url);

		const code = url.searchParams.get('code');
		if (!code) return new Response(JSON.stringify({ status: 'error' }), { status: 400, headers: { 'content-type': 'application/json' } });
		const { tokens } = await auth.getToken(code);
		config.Config.update({ google: { tokens: {oauth: code, refresh: tokens.refresh_token } } });		
		console.log(`\nRecieved code: ${code}\nRefresh token: ${tokens.refresh_token}`);
		
		setTimeout(() => Deno.exit(), 1000);
		return new Response(JSON.stringify({ status: 'success', code }), { headers: { 'content-type': 'application/json' } });
	})
}