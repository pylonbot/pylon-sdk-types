declare const global: typeof globalThis;

/*
  console logging
*/
interface Console {
  error(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]): void;
}

declare var console: Console;

/*
  base64 encode/decode and timers
*/
declare function atob(encodedString: string): string;
declare function btoa(rawString: string): string;

declare function setInterval(
  handler: (...args: any[]) => void,
  timeout?: number,
  ...arguments: any[]
): number;
declare function setTimeout(
  handler: (...args: any[]) => void,
  timeout?: number,
  ...arguments: any[]
): number;
declare function clearInterval(handle?: number): void;
declare function clearTimeout(handle?: number): void;
declare function sleep(timeout: number): void;

/*
  fetch() related utilities
*/

declare class FormData {
  constructor();

  append(name: string, value: string | Blob, fileName?: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string | Blob, fileName?: string): void;
  //forEach(callbackfn: (value: string, key: string, parent: FormData) => void, thisArg?: any): void;
}

declare class URLSearchParams {
  constructor(init?: string[][] | Record<string, string> | string | URLSearchParams);

  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  sort(): void;
  forEach(
    callbackfn: (value: string, key: string, parent: URLSearchParams) => void,
    thisArg?: any
  ): void;
}

declare class URL {
  constructor(url: string, base?: string | URL);
  hash: string;
  host: string;
  hostname: string;
  href: string;
  readonly origin: string;
  password: string;
  pathname: string;
  port: string;
  protocol: string;
  search: string;
  readonly searchParams: URLSearchParams;
  username: string;
  //toJSON(): string;
}

type BufferSource = ArrayBufferView | ArrayBuffer;

type BodyInit = BufferSource | Blob | FormData | URLSearchParams | string;

declare class Body {
  //readonly body: ReadableStream<Uint8Array> | null;
  //readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<any>;
  text(): Promise<string>;
}

type HeadersInit = Headers | string[][] | Record<string, string>;

declare class Headers {
  constructor(init?: HeadersInit);

  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
  toJSON(): { [key: string]: string[] };
}

type RequestInfo = Request | string;
type RequestRedirect = "follow" | "manaul" | "error";

interface RequestInit {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method?: string;
  redirect?: RequestRedirect;
  window?: any;
}

declare class Request extends Body {
  constructor(input: RequestInfo, init?: RequestInit);

  readonly headers: Headers;
  //readonly integrity: string;
  readonly method: string;
  //readonly redirect: RequestRedirect;
  readonly referrer: string;
  readonly url: string;
  clone(): Request;
}

interface ResponseInit {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
  url?: string;
}

declare class Response extends Body {
  constructor(body?: BodyInit | null, init?: ResponseInit);

  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  clone(): Response;
}

declare function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

/*
  blob
*/

type BlobPart = BufferSource | Blob | string;
type EndingType = "transparent" | "native";

interface BlobPropertyBag {
  endings?: EndingType;
  type?: string;
}

declare class Blob {
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);

  readonly size: number;
  readonly type: string;
  slice(start?: number, end?: number, contentType?: string): Blob;
}

/*
  text encoding/decoding
*/

interface TextDecodeOptions {
  stream?: boolean;
}

interface TextDecoderOptions {
  fatal?: boolean;
  ignoreBOM?: boolean;
}

declare class TextDecoder {
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;

  constructor(label?: string, options?: TextDecoderOptions);

  decode(input?: BufferSource, options?: TextDecodeOptions): string;
}

interface TextEncoderEncodeIntoResult {
  read?: number;
  written?: number;
}

declare class TextEncoder {
  readonly encoding: string;

  constructor();

  encode(input?: string): Uint8Array;
  encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult;
}

/* Pylon-specific */

declare module pylon {
  interface IKVPutOptions {
    ttl?: number;
    ttlEpoch?: Date;
    ifNotExists?: boolean;
  }

  interface IKVListOptions {
    from?: string;
    limit?: number;
  }

  class KVNamespace {
    namespace: string;
    constructor(namespace: string);

    put(key: string, value: string, options?: IKVPutOptions): Promise<void>;
    putJson(key: string, value: any, options?: IKVPutOptions): Promise<void>;
    putArrayBuffer(key: string, value: ArrayBuffer, options?: IKVPutOptions): Promise<void>;

    get(key: string): Promise<string | null>;
    getJson(key: string): Promise<any | null>;
    getArrayBuffer(key: string): Promise<ArrayBuffer | null>;

    list(options?: IKVListOptions): Promise<string[]>;

    delete(key: string): Promise<void>;
  }

  const kv: KVNamespace;
}
