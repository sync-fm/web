export enum usedEnvs {
	SPOTIFY_CLIENT_ID = "SPOTIFY_CLIENT_ID",
	SPOTIFY_CLIENT_SECRET = "SPOTIFY_CLIENT_SECRET",
	NEXT_PUBLIC_SUPABASE_ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY",
	NEXT_PUBLIC_SUPABASE_URL = "NEXT_PUBLIC_SUPABASE_URL",
	SUPABASE_SERVICE_KEY = "SUPABASE_SERVICE_KEY",
	REDIS_URL = "REDIS_URL",
	ADMIN_EMAIL = "ADMIN_EMAIL",
	ADMIN_DISCORD_ID = "ADMIN_DISCORD_ID",
	NODE_ENV = "NODE_ENV",
	NEXT_PUBLIC_APP_URL = "NEXT_PUBLIC_APP_URL",
	NEXT_PUBLIC_POSTHOG_KEY = "NEXT_PUBLIC_POSTHOG_KEY",
	NEXT_PUBLIC_POSTHOG_ENABLE_IN_DEV = "NEXT_PUBLIC_POSTHOG_ENABLE_IN_DEV",
	NEXT_PUBLIC_APP_VERSION = "NEXT_PUBLIC_APP_VERSION",
	POSTHOG_DISABLED = "POSTHOG_DISABLED",
	NEXT_RUNTIME = "NEXT_RUNTIME",
	NEXT_PUBLIC_RUNTIME_ENV = "NEXT_PUBLIC_RUNTIME_ENV",
	YOUTUBE_API_KEY = "YOUTUBE_API_KEY",
}

const defaultEnvValues: Record<usedEnvs, string> = {
	SPOTIFY_CLIENT_ID: "your-spotify-client-id",
	SPOTIFY_CLIENT_SECRET: "your-spotify-client-secret",
	NEXT_PUBLIC_SUPABASE_ANON_KEY: "your-supabase-key",
	NEXT_PUBLIC_SUPABASE_URL: "your-supabase-url",
	SUPABASE_SERVICE_KEY: "your-supabase-service-key",
	REDIS_URL: "redis://localhost:6379",
	ADMIN_EMAIL: "",
	ADMIN_DISCORD_ID: "",
	NODE_ENV: "development",
	NEXT_PUBLIC_APP_URL: "meow",
	NEXT_PUBLIC_POSTHOG_KEY: "",
	NEXT_PUBLIC_POSTHOG_ENABLE_IN_DEV: "false",
	NEXT_PUBLIC_APP_VERSION: "development",
	POSTHOG_DISABLED: "false",
	NEXT_RUNTIME: "",
	NEXT_PUBLIC_RUNTIME_ENV: "development",
	YOUTUBE_API_KEY: "your_youtube_api_key",
};

const failIfDefaultMap: Record<usedEnvs, boolean> = {
	SPOTIFY_CLIENT_ID: true,
	SPOTIFY_CLIENT_SECRET: true,
	NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
	NEXT_PUBLIC_SUPABASE_URL: true,
	SUPABASE_SERVICE_KEY: false, // Optional for now, required later for auth
	REDIS_URL: false, // Uses default
	ADMIN_EMAIL: false, // Optional
	ADMIN_DISCORD_ID: false, // Optional
	NODE_ENV: false,
	NEXT_PUBLIC_APP_URL: true,
	NEXT_PUBLIC_POSTHOG_KEY: false,
	NEXT_PUBLIC_POSTHOG_ENABLE_IN_DEV: false,
	NEXT_PUBLIC_APP_VERSION: false,
	POSTHOG_DISABLED: false,
	NEXT_RUNTIME: false,
	NEXT_PUBLIC_RUNTIME_ENV: false,
	YOUTUBE_API_KEY: true,
};
interface ValidateEnvOptions {
	silenceExceptErrors?: boolean;
}
export class meowenv {
	protected rawEnv: Record<usedEnvs, string> = process.env as Record<usedEnvs, string>;
	constructor(skipValidation = false) {
		if (!skipValidation) {
			for (const key of Object.values(usedEnvs)) {
				const value = this.rawEnv[key];
				const defaultValue = defaultEnvValues[key];
				const shouldFailIfDefault = failIfDefaultMap[key];
				if ((value === undefined || value === "") && shouldFailIfDefault) {
					throw new Error(`Environment variable ${key} is not set.`);
				}
				if (value === defaultValue && shouldFailIfDefault) {
					throw new Error(`Environment variable ${key} is set to default value. Please update it.`);
				}
			}
		}
	}
	public get(key: usedEnvs | keyof typeof usedEnvs): string {
		const value = this.rawEnv[key];
		return value;
	}

	public static validateEnv(
		options: ValidateEnvOptions = {
			silenceExceptErrors: true,
		}
	): void {
		const rawEnv: Record<usedEnvs, string> = process.env as Record<usedEnvs, string>;
		const warns: { key: usedEnvs; message: string }[] = [];
		const errors: { key: usedEnvs; message: string }[] = [];
		const successes: { key: usedEnvs; message: string }[] = [];

		for (const key of Object.values(usedEnvs)) {
			const value = rawEnv[key];
			const defaultValue = defaultEnvValues[key];
			const shouldFailIfDefault = failIfDefaultMap[key];
			if ((value === undefined || value === "") && shouldFailIfDefault) {
				errors.push({ key, message: `Environment variable ${key} is not set.` });
			}
			if (value === defaultValue && shouldFailIfDefault) {
				errors.push({
					key,
					message: `Environment variable ${key} which is required to be set correctly before running - is set to default value. Please update it.`,
				});
			}
			if (value === defaultValue && !shouldFailIfDefault) {
				warns.push({ key, message: `Environment variable ${key} is set to default value.` });
			}
			if (value !== undefined && value !== "" && value !== defaultValue) {
				successes.push({ key, message: `Environment variable ${key} is set correctly.` });
			}
		}
		for (const err of errors) {
			console.error(`ERROR: ${err.key} -  ${err.message}`);
		}
		if (!options.silenceExceptErrors) {
			for (const warn of warns) {
				console.warn(`WARNING: ${warn.key} - ${warn.message}`);
			}
			for (const success of successes) {
				console.log(`SUCCESS: ${success.key} -  ${success.message}`);
			}
		}
		if (errors.length > 0) {
			throw new Error(`Environment validation failed with ${errors.length} error(s).`);
		}
	}
}
