import { meowenv } from "@/lib/meow-env";

try {
	meowenv.validateEnv();
	console.log("Environment validation passed.");
	process.exit(0);
} catch (error) {
	console.error("Environment validation failed:", error);
	process.exit(1);
}
