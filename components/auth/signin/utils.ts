type StateStringVariants<State extends string, Schema extends Record<string, unknown>> = Record<
	State,
	Schema
>;

export function createStateStringResolver<
	State extends string,
	Schema extends Record<string, unknown>,
>(variants: StateStringVariants<State, Schema>, fallbackState: State) {
	const fallbackSchema = variants[fallbackState];
	if (!fallbackSchema) {
		throw new Error(
			`State string resolver requires a fallback variant. Missing '${fallbackState}'.`
		);
	}

	return (state?: State | null): Schema => {
		if (!state || !variants[state]) {
			return fallbackSchema;
		}

		if (state === fallbackState) {
			return fallbackSchema;
		}

		return {
			...fallbackSchema,
			...variants[state],
		};
	};
}
