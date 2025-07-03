(function(){//https://zenn.dev/chot/articles/lz-string-vs-compression-stream
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
class TextDeflater {// new CompressionStream('deflate') // chrome v80以降で使用可能。deflate-rawは103以降なのでそのpolifill的存在
    async #press(isDe=false, bytes, time=1) {
        --time;
        const upstream = this.#createUpstream(bytes);
        const presser = new (isDe ? DecompressionStream : CompressionStream)('deflate');
        console.log(presser)
        const stream = upstream.pipeThrough(presser);
        const pressed = await new Response(stream).arrayBuffer();
        return time<1 ? pressed : await this.#press(isDe, pressed, --time);
    }
    async #compress(bytes, time=1) {return await this.#press(false, bytes, time);}
    async #decompress(bytes, time=1) {return await this.#press(true, bytes, time);}
    /*
    async compress(bytes, time=1) {
        --time;
        const upstream = this.#createUpstream(bytes);
        const compression = new CompressionStream('deflate');
        const stream = upstream.pipeThrough(compression);
        const compressed = await new Response(stream).arrayBuffer();
//        console.log(time, compressed )
        return time<1 ? compressed : await this.compress(compressed, --time);
    }
    async decompress(compressedBytes, time=1) {
//        --time;
        const upstream = this.#createUpstream(compressedBytes);
        const decompression = new DecompressionStream('deflate');
        const stream = upstream.pipeThrough(decompression);
        const decompressed = await new Response(stream).arrayBuffer();
        return time<1 ? decompressed : await this.compress(decompressed, --time);
    }
    */
    async toBase64(text, time=1) {return btoa(String.fromCharCode(...new Uint8Array(await this.#compress(textEncoder.encode(text), time))))}
    /*
    async toBase64(text, time=1) {
        const pressed = await this.compress(textEncoder.encode(text), time);
        return btoa(String.fromCharCode(...new Uint8Array(pressed)));
    }
    */
    /*
    async toBase64(text, time=1) {
//        const upstream = this.#createUpstream(await this.compress(textEncoder.encode(text), time));
        const upstream = this.#createUpstream(textEncoder.encode(text));
        const compression = new CompressionStream('deflate');
        const stream = upstream.pipeThrough(compression);
        const compressed = await new Response(stream).arrayBuffer();
        return btoa(String.fromCharCode(...new Uint8Array(compressed)));
    }
    */
    async fromBase64(text, time=1) {return textDecoder.decode(await this.#decompress(Uint8Array.from(atob(text), (c)=>c.charCodeAt(0)), time));}
    /*
    async fromBase64(text, time=1) {
        const compressedBytes = Uint8Array.from(atob(text), (c)=>c.charCodeAt(0));
        const upstream = this.#createUpstream(compressedBytes);
        const decompression = new DecompressionStream('deflate');
        const stream = upstream.pipeThrough(decompression);
        const decompressed = await new Response(stream).arrayBuffer();
        return textDecoder.decode(decompressed);
    }
    */
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
    /*
    async toUtf16(text) {
        const upstream = this.#createUpstream(textEncoder.encode(text));
        const compression = new CompressionStream("deflate");
        const stream = upstream.pipeThrough(compression);
        const compressed = await new Response(stream).arrayBuffer();
        let compressedBytes = new Uint8Array(compressed);
        if (0!==compressedBytes.length % 2) {
            const paddedBytes = new Uint8Array(compressedBytes.length + 1);
            paddedBytes.set(compressedBytes);
            paddedBytes[compressedBytes.length] = 0; // 奇数個配列の場合、最後のバイトに 0 をパディング
            compressedBytes = paddedBytes;
        }
        const compressedUint16Array = new Uint16Array(compressedBytes.buffer);
        return String.fromCharCode(...compressedUint16Array);
    }
    */
    async fromUtf16(text, time=1) {
        const compressedUint16Array = new Uint16Array(text.split('').map((c) => c.charCodeAt(0)));
        let compressedBytes = new Uint8Array(compressedUint16Array.buffer);
        if (0===compressedBytes[compressedBytes.length - 1]) {
            compressedBytes = compressedBytes.slice(0, compressedBytes.length - 1); // パディングされた 0 を削除
        }
        return textDecoder.decode(await this.#decompress(compressedBytes, time));
    }
    /*
    async fromUtf16(text) {
        const compressedUint16Array = new Uint16Array(text.split('').map((c) => c.charCodeAt(0)));
        let compressedBytes = new Uint8Array(compressedUint16Array.buffer);
        if (0===compressedBytes[compressedBytes.length - 1]) {
            compressedBytes = compressedBytes.slice(0, compressedBytes.length - 1); // パディングされた 0 を削除
        }
        const upstream = this.#createUpstream(compressedBytes);
        const decompression = new DecompressionStream('deflate');
        const stream = upstream.pipeThrough(decompression);
        const decompressed = await new Response(stream).arrayBuffer();
        return textDecoder.decode(decompressed);
    }
    */
    async toU8a(text, time=1) {return new Uint8Array(await this.#compress(textEncoder.encode(text), time))};
    /*
    async toU8a(text) {
        const upstream = this.#createUpstream(textEncoder.encode(text));
        const compression = new CompressionStream('deflate');
        const stream = upstream.pipeThrough(compression);
        const compressed = await new Response(stream).arrayBuffer();
        return new Uint8Array(compressed);
    }
    */
    async fromU8a(u8a, time=1) {return textDecoder.decode(await this.#decompress(u8a, time))}
    /*
    async fromU8a(u8a) {
        const upstream = this.#createUpstream(u8a);
        const decompression = new DecompressionStream('deflate');
        const stream = upstream.pipeThrough(decompression);
        const decompressed = await new Response(stream).arrayBuffer();
        return textDecoder.decode(decompressed);
    }
    */
    async toUrl(text, time=1) {
        const withBase64 = await this.toBase64(text, time);
        return withBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    async fromUrl(text, time=1) {
        //let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
        //while (base64.length % 4) {base64 += '=';}
        //return this.fromBase64(base64);
        const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
        return await this.fromBase64(base64+('='.repeat(base64.length % 4)), time);
    }
    #createUpstream(value) {return new ReadableStream({
        start(controller) {
            controller.enqueue(value);
            controller.close();
        },
    });}
}
/*
class Base64 {
    fromU8a(bytes) {return btoa(String.fromCodePoint(...bytes))}
    toU8a(base64) {return Uint8Array.from(atob(base64), m=>m.codePointAt(0))}
    fromText(text) {return this.fromU8a(new TextEncoder().encode(text))}
    toText(base64) {return new TextDecoder().decode(this.toU8a(base64))}
    is(base64) {return /^[A-Za-z0-9+/]+={0,2}$/.test(base64);}
}
class Base64Url extends Base64 {
    fromU8a(bytes) {return super.fromU8a(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/, '')}
    toU8a(base64url) {return Uint8Array.from(atob(this.#toBase64(base64url)), m=>m.codePointAt(0))}
    fromText(text) {return this.fromU8a(new TextEncoder().encode(text))}
    toText(base64url) {return new TextDecoder().decode(this.toU8a(base64url))}
    is(base64url) {return /^[A-Za-z0-9\-_]+={0,2}$/.test(base64);}
    #toBase64(base64url) {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        return base64+('='.repeat(base64.length % 4));
    }
}
*/
class Base64 {
    static fromU8a(bytes) {return btoa(String.fromCodePoint(...bytes))}
    static toU8a(base64) {return Uint8Array.from(atob(base64), m=>m.codePointAt(0))}
    static fromText(text) {return this.fromU8a(new TextEncoder().encode(text))}
    static toText(base64) {return new TextDecoder().decode(this.toU8a(base64))}
    static is(base64) {return /^[A-Za-z0-9+/]+={0,2}$/.test(base64);}
}
class Base64Url extends Base64 {
    static fromU8a(bytes) {return super.fromU8a(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/, '')}
    static toU8a(base64url) {return Uint8Array.from(atob(this.#toBase64(base64url)), m=>m.codePointAt(0))}
    static fromText(text) {return this.fromU8a(new TextEncoder().encode(text))}
    static toText(base64url) {return new TextDecoder().decode(this.toU8a(base64url))}
    static is(base64url) {return /^[A-Za-z0-9\-_]+={0,2}$/.test(base64);}
    static #toBase64(base64url) {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        return base64+('='.repeat(base64.length % 4));
    }
}
class DataUrl {
    constructor() {
        this._REG = {
            base64: /^data:([A-Za-z0-9\/+\-_]);base64,([A-Za-z0-9\-_]+={0,2})$/,
            percent: /^data:([A-Za-z0-9\/+\-_]),([0-9A-Fa-f%]+={0,2})$/,
        };
    }
    is(dataUrl) {return this.isBase64(dataUrl) || this.isPercent(dataUrl);}
    isBase64(dataUrl) {return this._REG.base64.test(dataUrl);}
    isPercent(dataUrl) {return this._REG.percent.test(dataUrl);}
    async fromFile(file) {
        if (!(file instanceof File)){throw new TypeError(`引数はFile型であるべきです。`)}
        const u8a = new Uint8Array(await file.arrayBuffer());
        return `data:${file.type || 'application/octet-stream'};charset=utf8;base64,${Base64.fromU8a(u8a)}`;
    }
    toBlob(dataUrl) {// fetch(dataUri)だとHTTPS上でしか動作しないため不採用
        if (!this.is(dataUrl)){throw new TypeError(`引数はDataURL形式であるべきです。`)}
        const is64 = this.isBase64(dataUrl); //Base64とPercentEncodingの二種類ある
        const match = dataUrl.match(this._REG[is64 ? 'base64' : 'percent']);
        return new Blob((is64 ? Base64.toU8a : decodeURIComponent)(match[2]), {type:match[1]});
    }
}
window.TextDeflater = new TextDeflater();
//window.Base64 = new Base64();
//window.Base64Url = new Base64Url();
window.Base64 = Base64;
window.Base64Url = Base64Url;
window.DataUrl = new DataUrl();
})();
