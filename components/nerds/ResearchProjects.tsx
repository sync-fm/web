"use client";

import { FlaskConical } from "lucide-react";
import { researchProjects } from "./constants";

export const ResearchProjects = () => {
	return (
		<div className="rounded-[32px] border border-orange-300/40 bg-gradient-to-br from-orange-500/15 via-orange-500/8 to-black/60 p-8 backdrop-blur-2xl">
			<div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-orange-200/75">
				<FlaskConical className="h-4 w-4" />
				research & development
			</div>
			<div className="mt-6 space-y-6">
				{researchProjects.map((project) => (
					<div
						key={project.title}
						className="rounded-3xl border border-white/10 bg-black/45 p-6"
					>
						<p className="text-sm font-semibold text-white">{project.title}</p>
						<p className="mt-2 text-sm text-white/70">{project.body}</p>
						<div className="mt-4 flex flex-wrap gap-2 text-xs text-orange-100/75">
							{project.tags.map((tag) => (
								<span
									key={tag}
									className="rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1"
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
