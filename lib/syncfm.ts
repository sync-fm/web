export const runtime = "nodejs";

import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";

let _syncfm: SyncFM | null = null;
export function getSyncfm() {
	if (!_syncfm) {
		_syncfm = new SyncFM(syncfmconfig);
	}
	return _syncfm;
}
