window.addEventListener('DOMContentLoaded', async(event) => {
    console.log('DOMContentLoaded!!');
    const author = 'ytyaru';
    van.add(document.querySelector('main'), 
        van.tags.h1(van.tags.a({href:`https://github.com/${author}/JS.TextDeflater.20250703102225/`}, 'TextDeflater')),
        van.tags.p('文字列をDeflate圧縮する（Compression Streams API）'),
//        van.tags.p('Deflate compression (Compression Streams API)'),
    );
    van.add(document.querySelector('footer'),  new Footer('ytyaru', '../').make());

    const a = new Assertion();
    a.t(Type.isCls(TextDeflater));
    const exampleText = `適当なテキストです。

改行も含めます。

それなりに長いテキストでないと圧縮効果が見込めません。

少なくとも150バイト程度ではむしろDeflate圧縮した時のほうがデータ量が増えていました。
おそらくzlibメタデータが付与されたせいでしょう。

困ったことに300バイト程度でも足りないようです。
思ったよりも圧縮効果を出すには大量のテキストが必要そうです。

500バイト程度でようやく400バイト程度に圧縮できたようです。
本来のzlib圧縮であれば60〜70%ほど圧縮できるようですが。
まあBase64化により33%増加してしまうことを考えても妥当でしょうか。
実際は25%程度の圧縮になるようです。

1. テキストやバイナリをDeflate圧縮する（60〜70%圧縮）
2. Base64化する（33%増加）
3. 最終テキスト（25%程度の圧縮）
`;
    const textDeflater = new TextDeflater();
    // TextDeflater
    console.log('exampleText:', exampleText.length, new TextEncoder().encode(exampleText).length, exampleText)
    a.t(async()=>{
        const deflated = await textDeflater.toUrl(exampleText);
        const actual = await textDeflater.fromUrl(deflated);
        console.log('TextDeflater.toUrl:', deflated.length, deflated);
        return exampleText===actual;
    })
    a.t(async()=>{
        const deflated = await textDeflater.toBase64(exampleText);
        const actual = await textDeflater.fromBase64(deflated);
        console.log('TextDeflater.toBase64:', deflated.length, deflated);
        return exampleText===actual;
    })
    a.t(async()=>{
        const deflated = await textDeflater.toUtf16(exampleText);
        const actual = await textDeflater.fromUtf16(deflated);
        console.log('TextDeflater.toUtf16:', deflated.length, deflated);
        return exampleText===actual;
    })
    a.t(async()=>{
        const deflated = await textDeflater.toU8a(exampleText);
        const actual = await textDeflater.fromU8a(deflated);
        console.log('TextDeflater.toU8a:', deflated.length, deflated);
        return exampleText===actual;
    })
    // Base64
    a.t(Base64.is('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'));
    a.t(Base64.is('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/='));
    a.t(Base64.is('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/==')); // パディング=は0〜2個迄
    a.f(Base64.is('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_')); // Base64URL形式は偽
    a.t(()=>{
        const based = Base64.fromText(exampleText);
        const actual = Base64.toText(based);
        console.log('Base64.fromText:', based);
        return exampleText===actual;
    })
    a.t(()=>{
        const u8a = new TextEncoder().encode(exampleText);
        const based = Base64.fromU8a(u8a);
        const actual = Base64.toU8a(based);
        console.log('Base64.fromU8a:', based, actual);
        return exampleText===new TextDecoder().decode(actual);
    })
    a.t('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'===Base64.toBase64Url('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/=='));
    // Base64Url
    a.t(Base64Url.is('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'));// パディング=は省略される
    a.f(Base64Url.is('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'));// Base64形式は偽
    a.t(()=>{
        const based = Base64Url.fromText(exampleText);
        console.log(based)
        const actual = Base64Url.toText(based);
        console.log('Base64Url.fromText:', based);
        return exampleText===actual;
    })
    a.t(()=>{
        const u8a = new TextEncoder().encode(exampleText);
        const based = Base64Url.fromU8a(u8a);
        const actual = Base64Url.toU8a(based);
        console.log('Base64Url.fromU8a:', based, actual);
        return exampleText===new TextDecoder().decode(actual);
    })
    //console.log(Base64.fromText('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'));
    console.log(Base64.fromText(exampleText));
    console.log(Base64Url.fromText(exampleText));
    // DataUrl
    a.t(DataUrl.is('data:text/plain,%E5%B1%B1%E7%94%B0'));// 山田=%E5%B1%B1%E7%94%B0
    a.t(DataUrl.is('data:text/plain;charset=utf-8,%E5%B1%B1%E7%94%B0'));
    a.t(DataUrl.is('data:application/octet-stream,%E5%B1%B1%E7%94%B0'));
    a.t(DataUrl.is('data:application/octet-stream;charset=utf-8,%E5%B1%B1%E7%94%B0'));
    a.t(DataUrl.is('data:text/plain;base64,5bGx55Sw'));// 山田=5bGx55Sw
    a.t(DataUrl.is('data:text/plain;charset=utf-8;base64,5bGx55Sw'));
    a.f(DataUrl.isBase64('data:text/plain,%E5%B1%B1%E7%94%B0'))
    a.t(DataUrl.isBase64('data:text/plain;base64,5bGx55Sw'))
    a.t(DataUrl.isPercent('data:text/plain,%E5%B1%B1%E7%94%B0'))
    a.f(DataUrl.isPercent('data:text/plain;base64,5bGx55Sw'))
    a.t(async()=>{
        const blob = DataUrl.toBlob('data:text/plain;base64,5bGx55Sw');
        console.log(blob);
        //console.log(new TextDecoder().decode(Uint8Array.from(await blob.arrayBuffer())));
//        console.log(new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer())));
        //return blob instanceof Blob && 'text/plain'===blob.type && '山田'===new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()));
        return blob instanceof Blob && 'text/plain'===blob.type && '山田'===await blob.text();
    })
    a.t(async()=>{
        const blob = DataUrl.toBlob('data:text/plain,%E5%B1%B1%E7%94%B0');
        console.log(blob);
        console.log(await blob.text())
        return blob instanceof Blob && 'text/plain'===blob.type && '山田'===await blob.text();
    })
    a.t(async()=>{
        const blob = DataUrl.toBlob('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAGZJREFUOE/dk1EOwCAIQ8v9D+0yI6YyJDg/TPQLhb4QLAI6BSh8n8UCiOZ68Io5EYG4tgJWxApWjfwRDxALiIBu7YWAjA/CIZ4HbH/jzJkeuL35VraLZfekW9l6OzPEzzIxJAPgbh5BtFX9K/5cAAAAAABJRU5ErkJggg==');
        console.log(blob);
//        console.log(await blob.text())
//        return blob instanceof Blob && 'text/plain'===blob.type && '山田'===await blob.text();
        return blob instanceof Blob && 'image/png'===blob.type;
    })
    a.fin();
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

