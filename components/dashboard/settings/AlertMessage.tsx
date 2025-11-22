/**
 * Alert Message Component
 * Displays success or error messages
 */

"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle } from "lucide-react";

interface AlertMessageProps {
	type: "success" | "error";
	message: string;
}

export function AlertMessage({ type, message }: AlertMessageProps) {
	const isSuccess = type === "success";

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className={`flex items-center gap-3 rounded-2xl border p-4 backdrop-blur-xl ${
				isSuccess
					? "border-green-500/30 glass-bg-light text-green-200"
					: "border-red-500/30 glass-bg-light text-red-200"
			}`}
		>
			{isSuccess ? (
				<CheckCircle className="h-5 w-5 shrink-0" />
			) : (
				<AlertCircle className="h-5 w-5 shrink-0" />
			)}
			<p className="text-sm font-medium">{message}</p>
		</motion.div>
	);
}
