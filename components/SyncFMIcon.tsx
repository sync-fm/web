/** biome-ignore-all lint/performance/noImgElement: triangle company shush */

import { motion } from "framer-motion";
import type { Route } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import img from "../public/og-image.png";

const SIZE_VARIANTS = {
	small: "h-9 w-9",
	medium: "h-12 w-12",
	large: "h-16 w-16",
} as const;

const TAILWIND_BASE_REM = 0.25;

type CSSLength = `${number}${string}`;
type SyncFMIconSize = keyof typeof SIZE_VARIANTS | number | CSSLength;
interface SyncFMIconProps {
	size?: SyncFMIconSize;
	animate?: boolean;
	clickable?: boolean;
	href?: string;
	className?: string;
}

const SyncFMIconDefaultProps: Required<SyncFMIconProps> = {
	size: "medium",
	animate: true,
	clickable: true,
	href: "/",
	className: "rounded-2xl",
};

function mergeProps(props: SyncFMIconProps): Required<SyncFMIconProps> {
	const resolvedProps: SyncFMIconProps = { ...SyncFMIconDefaultProps };

	if (props.size !== undefined) resolvedProps.size = props.size;
	if (props.animate !== undefined) resolvedProps.animate = props.animate;
	if (props.clickable !== undefined) resolvedProps.clickable = props.clickable;
	if (props.href !== undefined) resolvedProps.href = props.href;
	if (props.className !== undefined) resolvedProps.className = props.className;

	return resolvedProps as Required<SyncFMIconProps>;
}

export const SyncFMIcon = ({ size, animate, clickable, className, href }: SyncFMIconProps) => {
	const props = mergeProps({ size, animate, clickable, className, href });
	switch (props.clickable) {
		case true: {
			return (
				<Link href={(props.href as Route) ?? "/"} className="flex items-center gap-3">
					{buildImage({
						animate: props.animate,
						size: props.size,
						className: props.className,
					})}
				</Link>
			);
		}
		case false: {
			return buildImage({
				animate: props.animate,
				size: props.size,
				className: props.className,
			});
		}
	}
};

function buildImage({ animate, size, className }: Omit<SyncFMIconProps, "clickable" | "href">) {
	const { className: sizeClassName, style } = resolveSizeAttributes(size);
	const mergedClassName = cn(sizeClassName, className);

	switch (animate) {
		case true: {
			return (
				<motion.img
					src={img.src}
					alt="SyncFM logo"
					className={mergedClassName}
					style={style}
					initial={{ rotate: -6, scale: 0.94 }}
					animate={{ rotate: 0, scale: 1 }}
					transition={{ type: "spring", stiffness: 170, damping: 15 }}
				/>
			);
		}
		case false: {
			return <img src={img.src} alt="SyncFM logo" className={mergedClassName} style={style} />;
		}
	}
}

function resolveSizeAttributes(size: SyncFMIconSize = "medium"): {
	className: string;
	style?: CSSProperties;
} {
	if (typeof size === "number") {
		const scaleValue = Math.max(size, 0);
		const remValue = scaleValue * TAILWIND_BASE_REM;
		const dimension = `${remValue}rem`;
		return {
			className: "",
			style: {
				width: dimension,
				height: dimension,
			},
		};
	}

	if (typeof size === "string" && isNamedSize(size)) {
		return { className: SIZE_VARIANTS[size] };
	}

	if (typeof size === "string") {
		return {
			className: "",
			style: {
				width: size,
				height: size,
			},
		};
	}

	return { className: SIZE_VARIANTS.medium };
}

function isNamedSize(value: string): value is keyof typeof SIZE_VARIANTS {
	return value in SIZE_VARIANTS;
}
