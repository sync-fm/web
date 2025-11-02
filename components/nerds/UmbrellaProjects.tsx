"use client";

import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { umbrellaProjects } from "./constants";

export const UmbrellaProjects = () => {
	return (
		<section className="rounded-[32px] border border-white/10 bg-black/45 p-8 backdrop-blur-2xl">
			<div className="flex flex-col gap-8 lg:flex-row lg:items-start">
				<div className="flex-1 space-y-4">
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/45">
						<Wrench className="h-4 w-4" />
						toolkit
					</span>
					<h2 className="text-3xl font-bold text-white md:text-[2.5rem]">
						Projects under the SyncFM umbrella
					</h2>
					<p className="max-w-2xl text-sm text-white/70 md:text-base">
						From canonical ID storage to typed adapters and UI surfaces, these
						projects are the production-hardened pieces that ship SyncFM every
						day.
					</p>
				</div>
				<div className="flex-1 space-y-4">
					{umbrellaProjects.map((project) => (
						<motion.div
							key={project.name}
							className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/6 via-white/3 to-white/10 p-5 backdrop-blur-xl"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5 }}
						>
							<p className="text-sm font-semibold text-white">{project.name}</p>
							<p className="mt-2 text-sm text-white/65">
								{project.description}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};
