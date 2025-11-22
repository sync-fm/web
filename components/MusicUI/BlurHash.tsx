"use client";

import { Blurhash } from "react-blurhash";

export function BlurHash({ hash }: { hash: string }) {
	return (
		<Blurhash
			hash={hash}
			width={"100%"}
			height={"100%"}
			resolutionX={64}
			resolutionY={64}
			punch={1}
		/>
	);
}
