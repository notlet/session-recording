import axios from 'npm:axios'
import { nanoid } from 'npm:nanoid';
import { toMerged } from "jsr:@es-toolkit/es-toolkit";
import { google } from 'googleapis';
import log4js from 'npm:log4js';
import Config from "./config.ts";
const config = new Config().get();

import auth from './auth.ts';
google.options({ auth });

export default class Stream {
	id: string;
	youtubeId: string | undefined = undefined;
	kasm: { id: string | undefined, user: string | undefined } = { id: undefined, user: undefined };
	link: string | undefined = undefined;
	#logger: log4js.Logger;
	#keepAlive: number | undefined = undefined;
	#title: string;
	#date: Date;

	constructor(settings: { title: string, date: Date, link: string, logLevel?: string }) {
		this.id = nanoid(10);
		this.#title = settings.title;
		this.#date = settings.date;
		this.link = settings.link;
		this.#logger = log4js.getLogger(`stream-${this.id}`);
		this.#logger.level = settings.logLevel || 'INFO';

		this.#logger.info(`Stream ${this.id} created with title: ${this.#title}, link: ${this.link}`);
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

		this.#logger.info(`Created Kasm ${kasmData.data.kasm_id}`);
		return this.kasm = { id: kasmData.data.kasm_id, user: kasmData.data.user_id };
	}

	async endKasm() {
		if ((await this.#kasmRequest('destroy_kasm', {
			kasm_id: this.kasm.id,
			user_id: this.kasm.user
		})).status !== 200) return false;

		this.#logger.info(`Destroyed Kasm ${this.kasm.id}`);
		this.kasm = { id: undefined, user: undefined };
		return true;
	}

	startKeepAlive() {
		if (this.#keepAlive || !this.kasm.id) return false;

		this.#keepAlive = setInterval(async () => {
			await this.#kasmRequest('keepalive', { kasm_id: this.kasm.id });
			this.#logger.debug(`Sent keepalive to Kasm ${this.kasm.id}`);
		}, 5 * 60 * 1000); // 5 minutes	

		this.#logger.info(`Started keepalive for Kasm ${this.kasm.id}`);
		return true;
	}

	stopKeepAlive() {
		if (!this.#keepAlive) return false;
		clearInterval(this.#keepAlive);
		this.#keepAlive = undefined;

		this.#logger.info(`Stopped keepalive for Kasm ${this.kasm.id}`);
		return true;
	}

	async getStreamId() {
		const active = (await google.youtube('v3').liveBroadcasts.list({
			"part": [ 'snippet', 'contentDetails' ,'status' ],
			"broadcastStatus": "active",
			"broadcastType": "all"
		}));
		
		if (!active.data.items || !active.data.items[0]?.id) return null;
		this.#logger.debug(`Found active youtube stream ${active.data.items[0].id}`);
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

		this.#logger.info(`Updated youtube stream ${this.youtubeId} with title "${this.#title}"`);
		return true;
	}

	async tryUpdateStreamData() {
		let tries = 0;
		while (!(await this.updateStreamData()) && tries < 5) {
			tries++;
			this.#logger.debug(`Failed to update stream data (attempt ${tries}), retrying in 10 seconds...`);
			await new Promise(resolve => setTimeout(resolve, 10000));
		}

		return tries < 5;
	}

	async endStream() {
		if (!(await this.getStreamId())) return false;
		
		await google.youtube('v3').liveBroadcasts.transition({
			part: ['status'],
			id: this.youtubeId,
			broadcastStatus: 'complete',
		})

		this.#logger.info(`Ended youtube stream ${this.youtubeId}`);
		return true;
	}

	async start() {
		await this.startKasm();
		this.startKeepAlive();
		await this.tryUpdateStreamData();
		return true;
	}

	async end() {
		await this.endKasm();
		this.stopKeepAlive();
		await this.endStream();
		return true;
	}
}