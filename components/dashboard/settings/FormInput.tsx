/**
 * Form Input Component
 * Reusable input field for settings forms
 */

"use client";

import type { LucideIcon } from "lucide-react";

interface FormInputProps {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	helpText?: string;
	icon?: LucideIcon;
	disabled?: boolean;
	type?: "text" | "email";
}

export function FormInput({
	id,
	label,
	value,
	onChange,
	placeholder,
	helpText,
	icon: Icon,
	disabled = false,
	type = "text",
}: FormInputProps) {
	return (
		<div>
			<label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground/80">
				{label}
			</label>
			<div className="relative">
				{Icon && (
					<div className="absolute left-3 top-1/2 -translate-y-1/2">
						<Icon className="h-4 w-4 text-muted-faint" />
					</div>
				)}
				<input
					type={type}
					id={id}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					disabled={disabled}
					className={`glass-bg-light glass-border-medium w-full rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60 ${Icon ? "pl-10" : ""}`}
				/>
			</div>
			{helpText && <p className="mt-1.5 text-xs text-muted-faint">{helpText}</p>}
		</div>
	);
}
