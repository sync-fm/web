import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "";
export interface CanvasRequest {
    tracks: CanvasRequest_Track[];
}
export interface CanvasRequest_Track {
    /** spotify:track:5osCClSjGplWagDsJmyivf */
    trackUri: string;
}
export interface CanvasResponse {
    canvases: CanvasResponse_Canvas[];
}
export interface CanvasResponse_Canvas {
    /** ef3bc2ac86ba4a39b2cddff19dca884a */
    id: string;
    /** https://canvaz.scdn.co/upload/artist/6i1GVNJCyyssRwXmnaeEFH/video/ef3bc2ac86ba4a39b2cddff19dca884a.cnvs.mp4 */
    canvasUrl: string;
    /** spotify:track:5osCClSjGplWagDsJmyivf */
    trackUri: string;
    artist: CanvasResponse_Canvas_Artist | undefined;
    /** 957a9be5e5c1b9ef1ac1c96b7cebf396 */
    otherId: string;
    /** spotify:canvas:1OuybAWK7XOQMG725ZtFwG */
    canvasUri: string;
}
export interface CanvasResponse_Canvas_Artist {
    /** spotify:artist:3E61SnNA9oqKP7hI0K3vZv */
    artistUri: string;
    /** CALVO */
    artistName: string;
    /** https://i.scdn.co/image/2d7b0ebe1e06c74f5c6b9a2384d746673051241d */
    artistImgUrl: string;
}
export declare const CanvasRequest: MessageFns<CanvasRequest>;
export declare const CanvasRequest_Track: MessageFns<CanvasRequest_Track>;
export declare const CanvasResponse: MessageFns<CanvasResponse>;
export declare const CanvasResponse_Canvas: MessageFns<CanvasResponse_Canvas>;
export declare const CanvasResponse_Canvas_Artist: MessageFns<CanvasResponse_Canvas_Artist>;
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
//# sourceMappingURL=canvas.d.ts.map