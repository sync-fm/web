type withSyncId = {
	syncId: string;
	url: null;
	canUse: true;
	identifierType: "syncId";
	identifier: string;
};
type withUrl = {
	syncId: null;
	url: string;
	canUse: true;
	identifierType: "url";
	identifier: string;
};

type usable = withSyncId | withUrl;
type unusable = {
	syncId: null;
	url: null;
	canUse: false;
	identifierType: null;
	identifier: null;
};
export type SafeParsePropsResult = usable | unusable;

export async function SafeParseProps(props: {
	params: Promise<{ searchParams: { url: string; syncId: string } }>;
	searchParams: Promise<{ url: string; syncId: string }>;
}): Promise<SafeParsePropsResult> {
	const paramsObj = (await props.params) ? await props.params : undefined;
	const searchParams = await props.searchParams;
	const rawUrl = paramsObj?.searchParams?.url ?? searchParams?.url;
	const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
	const rawSyncId = paramsObj?.searchParams?.syncId ?? searchParams?.syncId;
	const syncId = Array.isArray(rawSyncId) ? rawSyncId[0] : rawSyncId;

	if (url) {
		return {
			url,
			syncId: null,
			canUse: true,
			identifierType: "url",
			identifier: url,
		};
	}
	if (syncId) {
		return {
			syncId,
			url: null,
			canUse: true,
			identifierType: "syncId",
			identifier: syncId,
		};
	}
	return {
		syncId: null,
		url: null,
		canUse: false,
		identifierType: null,
		identifier: null,
	};
}
