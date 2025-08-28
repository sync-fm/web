import axios from 'axios';
import { CanvasRequest, CanvasResponse } from './canvas-protos/canvas.js';
import { BinaryWriter, BinaryReader } from "@bufbuild/protobuf/wire";
export async function getCanvasFromId(id, accessToken) {
    try {
        const trackUri = `spotify:track:${id}`;
        if (!accessToken) {
            console.error("No access token provided for Spotify Canvas request");
            return null;
        }
        // Create the request using the generated interfaces
        const track = {
            trackUri: trackUri
        };
        const canvasRequest = {
            tracks: [track]
        };
        // Serialize the request to binary
        const writer = new BinaryWriter();
        CanvasRequest.encode(canvasRequest, writer);
        const requestBytes = writer.finish();
        const response = await axios.post('https://spclient.wg.spotify.com/canvaz-cache/v0/canvases', requestBytes, {
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'application/protobuf',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept-Language': 'en',
                'User-Agent': 'Spotify/9.0.34.593 iOS/18.4 (iPhone15,3)',
                'Accept-Encoding': 'gzip, deflate, br',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (response.status !== 200) {
            console.error(`Canvas fetch failed: ${response.status} ${response.statusText}`);
            return null;
        }
        // Deserialize the response from binary
        const responseBytes = new Uint8Array(response.data);
        const reader = new BinaryReader(responseBytes);
        const parsed = CanvasResponse.decode(reader);
        return parsed;
    }
    catch (error) {
        console.error(`Canvas request error:`, error);
        return null;
    }
}
//# sourceMappingURL=GetCanvas.js.map