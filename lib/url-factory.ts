import { meowenv } from "@/lib/meow-env";
const env = new meowenv(true);


export const getErrorURL = (): URL => {
    return new URL(`${env.get("NEXT_PUBLIC_APP_URL")}/error`);
}
export const getURL = (path: string): URL => {
    let p = path
    if (!p.startsWith("/")) {
        p = `/${p}`;
    }
    return new URL(`${env.get("NEXT_PUBLIC_APP_URL")}${p}`);
}