/**
 * A lyric word with timing information
 */
export interface LyricWord {
	/** Start time in milliseconds */
	startTime: number;
	/** End time in milliseconds */
	endTime: number;
	/** The word text */
	word: string;
}

/**
 * A lyric line containing multiple words
 */
export interface LyricLine {
	/** Start time in milliseconds */
	startTime: number;
	/** End time in milliseconds */
	endTime: number;
	/** Array of words in this line */
	words: LyricWord[];
	/** Translated lyrics (optional) */
	translatedLyric?: string;
	/** Romanized lyrics (optional) */
	romanLyric?: string;
	/** Is this a background vocal line */
	isBG?: boolean;
	/** Is this a duet line (right-aligned) */
	isDuet?: boolean;
	/** Whether the line has word-level timing */
	isWordSynced?: boolean;
}

/**
 * Spring animation parameters
 */
export interface SpringParams {
	mass: number;
	damping: number;
	stiffness: number;
}

function timeTagToMs(tag: string): number {
	// "mm:ss.xx" → ms
	const [min, sec] = tag.split(":");
	return Number.parseInt(min, 10) * 60_000 + Math.round(Number.parseFloat(sec) * 1000);
}

export function parseLrcToLyricLines(lrc: string): LyricLine[] {
	const lineRegex = /\[(\d{2}:\d{2}\.\d{2})\](.*)/g;
	const enhancedRegex = /<(\d{2}:\d{2}\.\d{2})>/;

	const parsedLines: { startTime: number; text: string }[] = [];
	let match = lineRegex.exec(lrc);

	while (match !== null) {
		const time = timeTagToMs(match[1]);
		const text = match[2].trim();

		// Skip lines that have no lyric text
		if (text.length > 0) {
			parsedLines.push({ startTime: time, text });
		}
		match = lineRegex.exec(lrc);
	}

	return parsedLines.map((line, i) => {
		const startTime = line.startTime;
		const endTime = i < parsedLines.length - 1 ? parsedLines[i + 1].startTime : startTime + 2000; // fallback for final line

		const hasWordTags = enhancedRegex.test(line.text);
		let words: LyricWord[] = [];
		let isWordSynced = false;

		if (hasWordTags) {
			isWordSynced = true;
			const parts = line.text.split(/(<\d{2}:\d{2}\.\d{2}>)/);
			let currentTime = startTime;

			for (let j = 0; j < parts.length; j++) {
				const part = parts[j];
				if (enhancedRegex.test(part)) {
					currentTime = timeTagToMs(part.replace(/[<>]/g, ""));
				} else if (part.trim().length > 0) {
					const subWords = part.trim().split(/\s+/);

					// Find next tag time or use line end time
					let nextTime = endTime;
					for (let k = j + 1; k < parts.length; k++) {
						if (enhancedRegex.test(parts[k])) {
							nextTime = timeTagToMs(parts[k].replace(/[<>]/g, ""));
							break;
						}
					}

					const duration = nextTime - currentTime;
					const perWord = duration / Math.max(subWords.length, 1);

					subWords.forEach((w, idx) => {
						words.push({
							startTime: Math.round(currentTime + idx * perWord),
							endTime: Math.round(currentTime + (idx + 1) * perWord),
							word: w,
						});
					});

					// Advance time if we distributed it
					currentTime = nextTime;
				}
			}
		} else {
			isWordSynced = false;
			const wordStrings = line.text.split(/\s+/);
			const duration = endTime - startTime;
			const perWord = duration / Math.max(wordStrings.length, 1);

			words = wordStrings.map((w, idx) => {
				const wStart = Math.round(startTime + idx * perWord);
				const wEnd = Math.round(wStart + perWord);
				return {
					startTime: wStart,
					endTime: wEnd,
					word: w,
				};
			});
		}

		return {
			startTime,
			endTime,
			words,
			isWordSynced,
		};
	});
}
