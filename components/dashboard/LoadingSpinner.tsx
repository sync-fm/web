/**
 * Loading Spinner Component
 * Reusable loading spinner for dashboard pages
 */

"use client";

export function LoadingSpinner() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
		</div>
	);
}
