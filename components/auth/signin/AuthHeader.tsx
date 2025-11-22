"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type AuthFlowCopySchema, COPY_TRANSITION, type OAuthFlowType } from "./constants";

interface AuthHeaderProps {
	signInType: OAuthFlowType;
	copy: AuthFlowCopySchema;
}

export function AuthHeader({ signInType, copy }: AuthHeaderProps) {
	return (
		<div className="flex flex-col gap-2 text-center">
			<AnimatePresence mode="wait">
				<motion.div
					key={`copy-${signInType}`}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={COPY_TRANSITION}
					className="flex flex-col gap-2"
				>
					<h2 className="text-3xl font-bold text-foreground">{copy.heading}</h2>
					<p className="text-sm text-muted-foreground">{copy.description}</p>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
