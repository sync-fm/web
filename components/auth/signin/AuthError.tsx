interface AuthErrorProps {
	error: string | null;
}

export function AuthError({ error }: AuthErrorProps) {
	if (!error) return null;

	return (
		<div
			className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground"
			role="alert"
		>
			{error}
		</div>
	);
}
