import { stringify } from 'jsr:@std/yaml';
import { z } from "npm:zod";
import { toMerged, isEqual } from 'jsr:@es-toolkit/es-toolkit';
import { loadYaml } from "jsr:@niiju/safe-yaml-env";

export default class Config {
	static schema = z.object({
		google: z.object({
			client: z.object({
				id: z.string(),
				secret: z.string(),
			}),
			tokens: z.object({
				oauth: z.string().optional(),
				refresh: z.string().optional(),
			}).optional(),
		}),
		kasm: z.object({
			url: z.string(),
			imageId: z.string(),
			api: z.object({
				key: z.string(),
				secret: z.string(),
			})
		})
	});
	#config: z.infer<typeof Config.schema>;

	constructor() {
		this.#config = loadYaml("./config.yaml", Config.schema) as z.infer<typeof Config.schema>;
	}
	
	update(changes: object) {
		const newConfig = Config.schema.parse(toMerged(this.#config, changes));
		if (isEqual(newConfig, this.#config)) return false;
	
		this.#config = newConfig;
		Deno.writeTextFileSync('./config.yaml', stringify(newConfig));
		return true;
	}

	get() {
		return toMerged(this.#config, { Config: this });
	}
}