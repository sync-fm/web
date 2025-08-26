
export const runtime = 'nodejs';
import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.confic";

export const syncfm = new SyncFM(syncfmconfig)