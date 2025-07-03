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
    a.t(Type.isIns(TextDeflater));
    const exampleText = `適当なテキストです。

改行も含めます。
`
    console.log(await TextDeflater.toUrl(exampleText));
    console.log(await TextDeflater.toBase64(exampleText));
    console.log(await TextDeflater.toUtf16(exampleText));
    console.log(await TextDeflater.toU8a(exampleText));
    console.log(await TextDeflater.fromUrl(await TextDeflater.toUrl(exampleText)));
    console.log(await TextDeflater.fromBase64(await TextDeflater.toBase64(exampleText)));
    console.log(await TextDeflater.fromUtf16(await TextDeflater.toUtf16(exampleText)));
    console.log(await TextDeflater.fromU8a(await TextDeflater.toU8a(exampleText)));
    console.log(Base64.fromText('やあ😁'));
    console.log(Base64.toText(Base64.fromText('やあ😁')));
    console.log(Base64Url.fromText('やあ😁'));
    console.log(Base64Url.toText(Base64Url.fromText('やあ😁')));
    console.log(await DataUrl.fromFile(new File(['やあ😁'], 'some.txt', {type:'text/plain'})));

//    console.log([...new Array(3)].reduce(async(l,n)=>l=await TextDeflater.toUrl(n),exampleText));
    console.log(await TextDeflater.toUrl(exampleText));
    //console.log(await TextDeflater.compress(exampleText, 2));
//    console.log(await TextDeflater.compress(new TextEncoder().encode(exampleText), 1));
//    console.log(await TextDeflater.compress(new TextEncoder().encode(exampleText), 2));
//    console.log(await TextDeflater.compress(new TextEncoder().encode(exampleText), 3));
//    console.log(await TextDeflater.compress(new TextEncoder().encode(exampleText), 4));
//    a.t(true);
//    a.f(false);
//    a.e(TypeError, `msg`, ()=>{throw new TypeError(`msg`)});
    a.fin();
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

