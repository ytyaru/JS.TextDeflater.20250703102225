(function(){//https://zenn.dev/chot/articles/lz-string-vs-compression-stream
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
        const u8a = await file.bytes();
        return `data:${file.type || 'application/octet-stream'};base64,${Base64Url.fromU8a(await file.bytes())}`;
    }
    toBlob(dataUrl) {// fetch(dataUri)だとHTTPS上でしか動作しないため不採用
        if (!this.is(dataUrl)){throw new TypeError(`引数はDataURL形式であるべきです。`)}
        const is64 = this.isBase64(dataUrl); //Base64とPercentEncodingの二種類ある
        const match = dataUrl.match(this._REG[is64 ? 'base64' : 'percent']);
        return new Blob((is64 ? Base64Url.toU8a : decodeURIComponent)(match[2]), {type:match[1]});
    }
    /*
    toBlobByFileReader(dataUrl) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {u8arr[n] = bstr.charCodeAt(n);}
        return new Blob([u8arr], {type:mime});
    }
    fromBlobByFileReader(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    */
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
class FileDeflater {// new CompressionStream('deflate') // chrome v80以降で使用可能。deflate-rawは103以降なのでそのpolifill的存在
    // data: Array,ArrayBuffer,TypedArray,DataView,Blob
    // options: {type:'text/plain', endings:'transparent'/'native', lastModified: Date.now()}
    from(data, name, options) {return new File([data], name, options)}
    async fromBase64(base64, name, options) {return this.from(await TextDeflater.toUint8Array(await TextDeflater.fromBase64(base64)), name, options)}
    async toBase64(file, name, options) {
        const u8a = await file.bytes();
        return await TextDeflater.fromUint8Array(u8a);
    }
    toDataUri(file) {
        const mime = file.type; // text/plain application/octet-stream
        return `data:${mime}${base64},${data}`;
    }
        
    async toBase64(text) {
        const upstream = this.#createUpstream(textEncoder.encode(text));
        const compression = new CompressionStream('deflate');
        const stream = upstream.pipeThrough(compression);
        const compressed = await new Response(stream).arrayBuffer();
        return btoa(String.fromCharCode(...new Uint8Array(compressed)));
    }
    async fromBase64(text) {
        const compressedBytes = Uint8Array.from(atob(text), (c)=>c.charCodeAt(0));
        const upstream = this.#createUpstream(compressedBytes);
        const decompression = new DecompressionStream('deflate');
        const stream = upstream.pipeThrough(decompression);
        const decompressed = await new Response(stream).arrayBuffer();
        return textDecoder.decode(decompressed);
    }
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
    async toUint8Array(text) {
        const upstream = this.#createUpstream(textEncoder.encode(text));
        const compression = new CompressionStream('deflate');
        const stream = upstream.pipeThrough(compression);
        const compressed = await new Response(stream).arrayBuffer();
        return new Uint8Array(compressed);
    }
    async fromUint8Array(u8a) {
        const upstream = this.#createUpstream(u8a);
        const decompression = new DecompressionStream('deflate');
        const stream = upstream.pipeThrough(decompression);
        const decompressed = await new Response(stream).arrayBuffer();
        return textDecoder.decode(decompressed);
    }
    async toUri(text) {
        const withBase64 = await this.toBase64(text);
        return withBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    async fromUri(text) {
        //let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
        //while (base64.length % 4) {base64 += '=';}
        //return this.fromBase64(base64);
        const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
        return this.fromBase64(base64+('='.repeat(base64.length % 4)));
    }
    #createUpstream(value) {return new ReadableStream({
        start(controller) {
            controller.enqueue(value);
            controller.close();
        },
    });}
}
window.FileDeflater = new FileDeflater();
})();
