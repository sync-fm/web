//import type { NextRequest } from "next/server";
//import { Api } from "@statsfm/statsfm.js"
import { unauthorized } from "next/navigation";

/*
const statsfm = new Api({
    auth: {
        accessToken: process.env.STATSFM_API_KEY || "",
    },
    http: {
        retries: 1
    }
})
*/
export async function GET() {
	return unauthorized();
	/*
    const user = await statsfm.users.get("xwxfox");
    const profile = await statsfm.users.profile("xwxfox")
    return NextResponse.json({ user, profile });
    */
}
