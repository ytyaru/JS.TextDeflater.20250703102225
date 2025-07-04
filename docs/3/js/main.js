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
    /*
    const exampleTextPercent = '%E9%81%A9%E5%BD%93%E3%81%AA%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%81%A7%E3%81%99%E3%80%82%E6%94%B9%E8%A1%8C%E3%82%82%E5%90%AB%E3%82%81%E3%81%BE%E3%81%99%E3%80%82';
    console.log(await textDeflater.toUrl(exampleText));
    console.log(await textDeflater.toBase64(exampleText));
    console.log(await textDeflater.toUtf16(exampleText));
    console.log(await textDeflater.toU8a(exampleText));
    console.log(await textDeflater.fromUrl(await textDeflater.toUrl(exampleText)));
    console.log(await textDeflater.fromBase64(await textDeflater.toBase64(exampleText)));
    console.log(await textDeflater.fromUtf16(await textDeflater.toUtf16(exampleText)));
    console.log(await textDeflater.fromU8a(await textDeflater.toU8a(exampleText)));
    console.log(Base64.fromText('やあ😁'));
    console.log(Base64.toText(Base64.fromText('やあ😁')));
    console.log(Base64Url.fromText('やあ😁'));
    console.log(Base64Url.toText(Base64Url.fromText('やあ😁')));
    console.log(await DataUrl.fromFile(new File(['やあ😁'], 'some.txt', {type:'text/plain'})));
    console.log(DataUrl.toBlob(await DataUrl.fromFile(new File(['やあ😁'], 'some.txt', {type:'text/plain'}))));
    console.log(await DataUrl.toBlob(await DataUrl.fromFile(new File(['やあ😁'], 'some.txt', {type:'text/plain'}))).text());
    console.log(new TextDecoder().decode(await (await DataUrl.toBlob(await DataUrl.fromFile(new File(['やあ😁'], 'some.txt', {type:'text/plain'})))).arrayBuffer()));
    console.log(await (new File(['やあ😁'], 'some.txt', {type:'text/plain'})).text());
    console.log(await DataUrl.toBlob('data:text/plain;charset=utf8;base64,44KE44GC8J+YgQ==').text());
    console.log(await DataUrl.toBlob('data:text/plain;base64,44KE44GC8J+YgQ==').text());
//    console.log(/^data:([A-Za-z0-9\/+\-_])/.test('data:text/plain;base64,44KE44GC8J+YgQ=='));

//    console.log([...new Array(3)].reduce(async(l,n)=>l=await textDeflater.toUrl(n),exampleText));
    //console.log(await textDeflater.compress(exampleText, 2));
//    console.log(await textDeflater.compress(new TextEncoder().encode(exampleText), 1));
//    console.log(await textDeflater.compress(new TextEncoder().encode(exampleText), 2));
//    console.log(await textDeflater.compress(new TextEncoder().encode(exampleText), 3));
//    console.log(await textDeflater.compress(new TextEncoder().encode(exampleText), 4));
//    a.t(true);
//    a.f(false);
//    a.e(TypeError, `msg`, ()=>{throw new TypeError(`msg`)});
    */
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
//    console.log(Base64Url.toBase64(Base64.toBase64Url(Base64.fromText('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'))))
//    a.t(()=>'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'===Base64Url.toBase64(Base64.toBase64Url(Base64.fromText('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'))));

//    a.t(()=>'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'===Base64Url.toBase64('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'));
//    a.t(()=>'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/0'===Base64Url.toBase64('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_0'));
    // MDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXotXw==
    // MDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXotXw==
//    console.log(Base64.fromText('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'));
//    console.log(Base64Url.toBase64('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_A'));
    //a.t('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/A='===Base64Url.toBase64('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_A'));
//    a.t(()=>'6YGp5b2T44Gq44OG44Kt44K544OI44Gn44GZ44CCCgrmlLnooYzjgoLlkKvjgoHjgb7jgZnjgIIKCuOBneOCjOOBquOCiuOBq+mVt+OBhOODhuOCreOCueODiOOBp+OBquOBhOOBqOWcp+e4ruWKueaenOOBjOimi+i+vOOCgeOBvuOBm+OCk+OAggo='===Base64Url.toBase64('6YGp5b2T44Gq44OG44Kt44K544OI44Gn44GZ44CCCgrmlLnooYzjgoLlkKvjgoHjgb7jgZnjgIIKCuOBneOCjOOBquOCiuOBq-mVt-OBhOODhuOCreOCueODiOOBp-OBquOBhOOBqOWcp-e4ruWKueaenOOBjOimi-i-vOOCgeOBvuOBm-OCk-OAggo'));

//    console.log(atob('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'));
//    console.log(atob('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/='));
//    Base64Url.fromText()
    // DataUrl
    a.t(DataUrl.is('data:text/plain,%E5%B1%B1%E7%94%B0'));// 山田=%E5%B1%B1%E7%94%B0
    a.t(DataUrl.is('data:text/plain;charset=utf-8,%E5%B1%B1%E7%94%B0'));
    a.t(DataUrl.is('data:application/octet-stream,%E5%B1%B1%E7%94%B0'));
    a.t(DataUrl.is('data:application/octet-stream;charset=utf-8,%E5%B1%B1%E7%94%B0'));
    a.fin();
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

