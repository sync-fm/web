"use client";
import { motion } from "framer-motion";

export const LoadingUI = () => {
	return (
		<div className="relative min-h-screen w-full overflow-hidden">
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-linear-to-br from-black via-gray-800 to-gray-900" />
				<div className="absolute inset-0 backdrop-blur-3xl" />
			</div>
			<div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="w-16 h-16 border-t-4 border-b-4 border-white/20 rounded-full animate-spin"
				/>
				<p className="mt-4 text-white/70 text-sm tracking-wide">Listening to the tunes...</p>
			</div>
		</div>
	);
};
