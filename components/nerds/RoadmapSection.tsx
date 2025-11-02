"use client";

import { Zap } from "lucide-react";
import { roadmap } from "./constants";

export const RoadmapSection = () => {
	return (
		<div className="rounded-[32px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl">
			<div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/45">
				<Zap className="h-4 w-4" />
				Roadmap
			</div>
			<div className="mt-6 space-y-5 text-sm text-white/70">
				{roadmap.map((item) => (
					<div
						key={item.title}
						className="rounded-3xl border border-white/15 bg-black/45 p-5"
					>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-white">{item.title}</p>
						</div>
						<p className="mt-2 text-sm text-white/65">{item.description}</p>
					</div>
				))}
			</div>
		</div>
	);
};
