"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type AuthFlowCopySchema, COPY_TRANSITION, type OAuthFlowType } from "./constants";

interface AuthToggleProps {
	signInType: OAuthFlowType;
	copy: AuthFlowCopySchema;
	onToggle: (target: OAuthFlowType) => void;
}

export function AuthToggle({ signInType, copy, onToggle }: AuthToggleProps) {
	return (
		<div className="mt-4 text-center text-sm text-muted-foreground">
			<AnimatePresence mode="wait">
				<motion.div
					key={`toggle-${signInType}`}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -6 }}
					transition={COPY_TRANSITION}
				>
					<span className="mr-1">{copy.toggle.prompt}</span>
					<button
						type="button"
						onClick={() => onToggle(copy.toggle.target)}
						className="font-semibold text-primary/80 underline-offset-2 transition hover:text-primary hover:underline"
					>
						{copy.toggle.action}
					</button>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
