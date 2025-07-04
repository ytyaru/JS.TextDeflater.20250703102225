(function(){//https://zenn.dev/chot/articles/lz-string-vs-compression-stream
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
class TextDeflater {// new CompressionStream('deflate') // chrome v80以降で使用可能。deflate-rawは103以降なのでそのpolifill的存在
    constructor(F='deflate', R=false) {
        this._format=this.isValidFormat(F) ? F : 'deflate';
        this._isResettableFormat = !!R;
    }
    isValidFormat(f){return 'gzip deflate deflate-raw'.split(' ').includes(f)}
    get isResettableFormat() {return this._isResettableFormat}
    get format() {return this._format}
    set format(f) {if (this.isValidFormat(f) && this.isResettableFormat){this._format=f}}
    async #press(isDe=false, bytes, time=1) {
        --time;
        const upstream = this.#createUpstream(bytes);
        const presser = new (isDe ? DecompressionStream : CompressionStream)(this._format);
        const stream = upstream.pipeThrough(presser);
        const pressed = await new Response(stream).arrayBuffer();
        return time<1 ? pressed : await this.#press(isDe, pressed, --time);
    }
    async #compress(bytes, time=1) {return await this.#press(false, bytes, time);}
    async #decompress(bytes, time=1) {return await this.#press(true, bytes, time);}
    async toBase64(text, time=1) {return btoa(String.fromCharCode(...new Uint8Array(await this.#compress(textEncoder.encode(text), time))))}
    async fromBase64(text, time=1) {return textDecoder.decode(await this.#decompress(Uint8Array.from(atob(text), (c)=>c.charCodeAt(0)), time));}
    async toUtf16(text, time=1) {
        let compressedBytes = new Uint8Array(await this.#compress(textEncoder.encode(text), time));
        if (0!==compressedBytes.length % 2) {
            const paddedBytes = new Uint8Array(compressedBytes.length + 1);
            paddedBytes.set(compressedBytes);
            paddedBytes[compressedBytes.length] = 0; // 奇数個配列の場合、最後のバイトに 0 をパディング
            compressedBytes = paddedBytes;
        }
        const compressedUint16Array = new Uint16Array(compressedBytes.buffer);
        return String.fromCharCode(...compressedUint16Array);
    }
    async fromUtf16(text, time=1) {
        const compressedUint16Array = new Uint16Array(text.split('').map((c) => c.charCodeAt(0)));
        let compressedBytes = new Uint8Array(compressedUint16Array.buffer);
        if (0===compressedBytes[compressedBytes.length - 1]) {
            compressedBytes = compressedBytes.slice(0, compressedBytes.length - 1); // パディングされた 0 を削除
        }
        return textDecoder.decode(await this.#decompress(compressedBytes, time));
    }
    async toU8a(text, time=1) {return new Uint8Array(await this.#compress(textEncoder.encode(text), time))};
    async fromU8a(u8a, time=1) {return textDecoder.decode(await this.#decompress(u8a, time))}
    async toUrl(text, time=1) {
        const withBase64 = await this.toBase64(text, time);
        return withBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    async fromUrl(text, time=1) {
        const base = text.replace(/-/g, '+').replace(/_/g, '/');
        for (let i=0; i<3; i++) {// Base64パディング=が0〜2の内どれか不明なので3パターン試して成功したのを返す
            const padding = '='.repeat(i);
            const base64 = base+padding;
            try {return await this.fromBase64(base64)}
            catch(e){console.warn(e)}
        }
        throw new TypeError(`引数が不正値です。new TextDeflater().toUrl('some')な値をセットしてください。`);
    }
    #createUpstream(value) {return new ReadableStream({
        start(controller) {
            controller.enqueue(value);
            controller.close();
        },
    });}
}
class Base64 {
    static fromText(text) {return this.fromU8a(new TextEncoder().encode(text))}
    static toText(base64) {return new TextDecoder().decode(this.toU8a(base64))}
    static fromU8a(bytes) {return btoa(String.fromCodePoint(...bytes))}
    static toU8a(base64) {return Uint8Array.from(atob(base64), m=>m.codePointAt(0))}
    static is(base64) {return /^[A-Za-z0-9+/]+={0,2}$/.test(base64);}
    static toBase64Url(base64){return base64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/, '')}
    static toBase64UrlFromU8a(bytes){return this.toBase64Url(this.fromU8a(bytes))}
    static toBase64UrlFromText(text){return this.toBase64UrlFromU8a(new TextEncoder().encode(text))}
}
//class Base64Url extends Base64 {
class Base64Url {
    static fromText(text) {return this.fromU8a(new TextEncoder().encode(text))}
    static toText(base64url) {return new TextDecoder().decode(this.toU8a(base64url))}
    static fromU8a(bytes) {return Base64.fromU8a(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/, '')}
    static toU8a(base64url) {return Base64.toU8a(this.#toBase64(base64url));}
    static is(base64url) {return /^[A-Za-z0-9\-_]+$/.test(base64url);}
    static #toBase64(base64url) {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        let B = base64;
        while (B.length % 4) {B += '=';}
        console.log(B)
        return B;
    }
    static toBase64(base64url) {
        for (let i=0; i<3; i++) {
            const padding = '='.repeat(i);
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
            console.log(base64)
            try {return Base64.fromU8a(Base64.toU8a(base64))}
            catch(e){console.warn(e)}
        }
        throw new TypeError('引数が不正値です。');
    }
}
//data:text/plain;charset=utf8;base64,44KE44GC8J+YgQ==
const REG_B = /^data:([A-Za-z0-9\/+\-_]+)(;charset=[A-Za-z0-9\-_]+)?;base64,([A-Za-z0-9+\/]+={0,2})$/; // Base64
const REG_P = /^data:([A-Za-z0-9\/+\-_]+)(;charset=[A-Za-z0-9\-_]+)?,([0-9A-Fa-f%]+={0,2})$/; // Percent
class DataUrl {
    static is(dataUrl) {return this.isBase64(dataUrl) || this.isPercent(dataUrl);}
    static isBase64(dataUrl) {return REG_B.test(dataUrl);}
    static isPercent(dataUrl) {return REG_P.test(dataUrl);}
    static async fromFile(file) {
        if (!(file instanceof File)){throw new TypeError(`引数はFile型であるべきです。`)}
        const u8a = new Uint8Array(await file.arrayBuffer());
        return `data:${file.type || 'application/octet-stream'};charset=utf8;base64,${Base64.fromU8a(u8a)}`;
    }
    static toBlob(dataUrl) {// fetch(dataUri)だとHTTPS上でしか動作しないため不採用
        console.log(this.isBase64(dataUrl), this.isPercent(dataUrl), dataUrl);
        if (!this.is(dataUrl)){throw new TypeError(`引数はDataURL形式であるべきです。`)}
        const is64 = this.isBase64(dataUrl); //Base64とPercentEncodingの二種類ある
        const match = dataUrl.match(is64 ? REG_B : REG_P);
        console.log((is64 ? Base64.toU8a : decodeURIComponent)(match[3]));
        const data = (is64 ? Base64.toU8a : decodeURIComponent)(match[3]);
        return new Blob(this.#isText(match) ? (is64 ? [...textDecoder.decode(data)] : [...data]) : data, {type:match[1]});
        //return new Blob(this.#isText(match) ? (is64 ? [...textDecoder.decode(data)] : [...textEncoder.encode(data)]) : data, {type:match[1]});
        //return new Blob(this.#isText(match) ? [...textDecoder.decode(data)] : data, {type:match[1]});
        //return new Blob((is64 ? Base64.toU8a : decodeURIComponent)(match[3]), {type:match[1]});
    }
    static #isText(match) {// base64データがテキストかバイナリか（完璧な区別をつけるのは実質不可能。imgage/svg+xmlもテキストの可能性があるがsvgz(gzip)の場合も同じMIMEで表されるのに、その内容はバイナリである。よってテキスト／バイナリの区別をMIMEでするのは不可能。base64文字列をバイナリ解析してそれっぽく判断することも不可能ではないが完璧な判断は不可能）
        return match[1].startsWith('text/');
    }
}
window.TextDeflater = TextDeflater;
window.Base64 = Base64;
window.Base64Url = Base64Url;
window.DataUrl = DataUrl;
})();
