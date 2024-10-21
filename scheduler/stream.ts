import axios from 'npm:axios'
import { toMerged } from "jsr:@es-toolkit/es-toolkit";
import { google } from 'googleapis';

import Config from "./config.ts";
const config = new Config().get();

import auth from './auth.ts';
google.options({ auth });

export default class Stream {
	youtubeId: string | null = null;
	kasm: { id: string | null, user: string | null } = { id: null, user: null };
	link: string | null = null;
	#title: string | null = null;
	#date: Date | null = null;

	constructor(settings: { title: string, date: Date, link: string }) {
		this.#title = settings.title;
		this.#date = settings.date;
		this.link = settings.link;
	}

	#kasmRequest = (endpoint: string, data: object) => axios.post(`${config.kasm.url}/api/public/${endpoint}`, toMerged(data, {
		api_key: config.kasm.api.key,
		api_key_secret: config.kasm.api.secret,
	}), { headers: {'Content-Type': 'application/json', 'User-Agent': 'Scheduler'} });

	async startKasm() {
		const kasmData = await this.#kasmRequest('request_kasm', {
			image_id: config.kasm.imageId,
			enable_sharing: true,
			environment: { INVITE_LINK: this.link }
		});
		return this.kasm = { id: kasmData.data.kasm_id, user: kasmData.data.user_id };
	}

	async endKasm() {
		if ((await this.#kasmRequest('request_kasm', {
			kasm_id: this.kasm.id,
			user_id: this.kasm.user
		})).status !== 200) return false;

		this.kasm = { id: null, user: null };
		return true;
	}

	async getStreamId() {
		const active = (await google.youtube('v3').liveBroadcasts.list({
			"part": [ 'snippet', 'contentDetails' ,'status' ],
			"broadcastStatus": "active",
			"broadcastType": "all"
		}));

		if (active.data.items.length < 1) return null;

		return this.youtubeId = active.data.items[0].id;
	}

	async updateStreamData() {
		if (!(await this.getStreamId())) return false;

		await google.youtube('v3').liveBroadcasts.update({
			part: ['snippet', 'status'],
			requestBody: {
				id: this.youtubeId,
				snippet: {
					title: `${this.#title} ${this.#date?.getDate()}.${this.#date?.getMonth()! + 1}.${this.#date?.getFullYear()}`,
					description: 'https://github.com/notlet/session-recording',
				},
				status: {
					privacyStatus: 'public',
				},
			},
		});

		return true;
	}

	async endStream() {
		if (!(await this.getStreamId())) return false;
		
		await google.youtube('v3').liveBroadcasts.transition({
			part: ['status'],
			id: this.youtubeId,
			broadcastStatus: 'complete',
		})
		return true;
	}

	async end() {
		await this.endKasm();
		await this.endStream();
		return true;
	}
}