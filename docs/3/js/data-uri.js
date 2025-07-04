(function(){
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
        /*
        const d = {is: this.is(dataUrl)}
        if (!is){throw new TypeError(`引数はDataURL形式であるべきです。`)}
        d.reg = this.isBase64(dataUrl) ? 'base64' : 'percent';
        d.m = this.isBase64(dataUrl) ? Base64Url.toU8a : decodeURIComponent;
        const match = dataUrl.match(this._REG[d.reg]);
        const [mime, data] = [match[1], match[2]];
        return new Blob(d.m(data), {type:mime});
        //return d.is ? new Blob(d.m(data), {type:mime}) : ({throw new TypeError(`引数はDataURL形式であるべきです。`)})();
        */
        /*
        const d = {
            is: this.is(dataUrl),
            reg: this.isBase64(dataUrl) ? 'base64' : 'percent',
            m: this.isBase64(dataUrl) ? Base64Url.toU8a : decodeURIComponent,
        };
        if (this.isBase64(dataUrl)) {
            const match = dataUrl.match(this._REG.base64);
            const [mime, base64] = [match[1], match[2]];
            return new Blob(Base64Url.toU8a(base64), {type:mime});
        }
        else if (this.isPercent(dataUrl)) {
            const match = dataUrl.match(this._REG.percent);
            const [mime, percent] = [match[1], match[2]];
            return new Blob([decodeURIComponent(percent)], {type:mime});
        }
        else {throw new TypeError(`引数はDataURL形式であるべきです。`)}
        */
    }
/*
// Data URIからFileオブジェクトへの変換
async function dataUriToFile(dataUri, filename) {
    const response = await fetch(dataUri);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
}

// FileオブジェクトからData URIへの変換
function fileToDataUri(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

    async toFile(dataUri) {
        return await new Promise((resolve, reject) => {
            const fr = new FileReader();
            const acts = {
                abort: () => {unsubscribe();reject(new Error('abort'));},
                error: (event) => {unsubscribe();reject(event.target.error);},
                load: (event) => {unsubscribe();resolve(event.target.result);},
            };
            const names = 'abort error load'.split(' ');
            const subscribe = () =>names.map(n=>fr.addEventListener(n, acts[n]));
            const unsubscribe = () =>names.map(n=>fr.removeEventListener(n, acts[n]));
            subscribe();
            fr.readAsDataURL(blob);
         })
    }
            const subscribe = () => {
                
                fr.addEventListener('abort', onAbort)
                fr.addEventListener('error', onError)
                fr.addEventListener('load', onLoad)
            }
            const unsubscribe = () => {
                fr.removeEventListener('abort', onAbort)
                fr.removeEventListener('error', onError)
                fr.removeEventListener('load', onLoad)
            }
            const onAbort = () => {unsubscribe();reject(new Error('abort'));}
            const onError = (event) => {unsubscribe();reject(event.target.error);}
            const onLoad = (event) => {unsubscribe();resolve(event.target.result);}
            subscribe();
            fr.readAsDataURL(blob);
*/
    async fromFile(file) {
        if (!(file instanceof File)) {throw new TypeError(`引数はFile型であるべきです。`)}
        const isTxt = this.#isText(file);
        const base64 = isTxt ? '' : ';base64';
        const data = isTxt ? await TextDeflater.fromUint8Array(await file.bytes()) : await file.text();
        if (this.#isText(file)) {
        return `data:${file.type}${base64},${await file.bytes()}`;

        await file.bytes()
        return `data:${file.type};base64,${await file.bytes()}`;
    }
    #isText(file) {return file.type.startsWith('text/')}// || file.type.endsWith('svg+xml')も含めたいがそのMIMEはsvgとsvgz(圧縮バイナリ)の両方を含むためテキストかバイナリかを判別できない！
    toFile(file) {
        if (!(file instanceof File)) {throw new TypeError(`引数はFile型であるべきです。`)}
        `data:${file.type}${base64},${data}`

    }
    fromDataUir(dataUri) {

    }
}
})();
