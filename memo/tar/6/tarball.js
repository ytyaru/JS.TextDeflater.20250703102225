// https://raw.githubusercontent.com/ankitrohatgi/tarballjs/refs/heads/master/tarball.js
(function(){
class TarReader {
    constructor() {this._fileInfo = [];}
    get fileInfo() {return this._fileInfo}
    get files() {return this._getFiles()}
    *_getFiles() {
        for (let info of this.fileInfo) {
            yield new File([this.getFileBinary(info.name)], info.name, {type:'', lastModified:this._readFileMtime(info.header_offset)});
        }
    }
    fromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.buffer = event.target.result;
                this._fileInfo = [];
                this._readFileInfo();
                resolve(this._fileInfo);
            };
            reader.readAsArrayBuffer(file);
        });
    }
    fromBuffer(arrayBuffer) {
        this.buffer = arrayBuffer;
        this._fileInfo = [];
        this._readFileInfo();
        return this._fileInfo;
    }
    _readFileInfo() {
        this._fileInfo = [];
        let [offset, fileSize, fileName, fileType] = [0,0,'',null];
        while(offset < this.buffer.byteLength - 512) {
            console.log(this.buffer.byteLength, offset, this.buffer.byteLength - 512)
            fileName = this._readFileName(offset); // file name
            if(fileName.length == 0) {break;}
            fileType = this._readFileType(offset);
            fileSize = this._readFileSize(offset);
            this._fileInfo.push({
                'name': fileName,
                'type': fileType,
                'size': fileSize,
                'header_offset': offset
            });
            offset += (512 + 512*Math.trunc(fileSize/512));
            if(fileSize % 512) {offset += 512;}
        }
        console.log(this._fileInfo)
    }
    _readString(str_offset, size) {
        const strView = new Uint8Array(this.buffer, str_offset, size);
        return new TextDecoder().decode(strView.slice(0, strView.indexOf(0)));
    }
    _readFileName(header_offset) {return this._readString(header_offset, 100);}
    _readFileType(header_offset) {
        let typeView = new Uint8Array(this.buffer, header_offset+156, 1);// offset: 156
        let typeStr = String.fromCharCode(typeView[0]);
        if('0'===typeStr) {return 'file';}
        else if('5'===typeStr) {return 'directory';}
        else {return typeStr;}
    }
    _readFileSize(header_offset) {
        let szView = new Uint8Array(this.buffer, header_offset+124, 12);// offset: 124
        return parseInt([...new Array(11)].reduce((s,_,i)=>s+=String.fromCharCode(szView[i]), ''), 8);
    }

    _readInt(header_offset, size) {return parseInt(this._readString(header_offset, size))}
    _readFileMode(header_offset) {return this._readInt(header_offset+100, 8);}// offset: 100 mode.padStart(7,'0'), 
    _readFileUid(header_offset) {return this._readInt(header_offset+108, 8);}//offset:108 this._readInt(uid.padStart(7,'0'), 
    _readFileGid(header_offset) {return this._readInt(header_offset+116, 8);}// offset: 116 gid.padStart(7,'0'), 
    _readFileMtime(header_offset) {return this._readInt(header_offset+136, 12);}// offset: 136 mtime.padStart(11,'0'), 
    _readFileUser(header_offset) {return this._readInt(header_offset+265, 32);}// offset: 265 user, 
    _readFileGroup(header_offset) {return this._readInt(header_offset+297, 32);}// offset: 297 group, 

    _readFileBlob(fileOffset, size, mimeType) {return new Blob([new Uint8Array(this.buffer, fileOffset, size)], {type: mimeType})};
    _readFileBinary(fileOffset, size) {return new Uint8Array(this.buffer, fileOffset, size)}
    _readTextFile(fileOffset, size) {return new TextDecoder().decode(new Uint8Array(this.buffer, fileOffset, size))}
    _readFile(type='TextFile', fileName, mimeType) {// args:fileName, mimeType
        const info = this._fileInfo.find(info=>fileName===info.name);
        if (info) {return this[`_read${type}`](info.header_offset+512, info.size, mimeType);}
    }
    getTextFile(fileName) {return this._readFile('TextFile', fileName);}
    getFileBlob(fileName, mimeType) {return this._readFile('FileBlob', fileName, mimeType);}
    getFileBinary(fileName) {return this._readFile('FileBinary', fileName);}
}
class TarWriter {
    constructor() {this.fileData = [];}
    addTextFile(name, text, opts) {this._addFileData(name, opts, new TextEncoder().encode(text))}
    addFileArrayBuffer(name, arrayBuffer, opts) {this._addFileData(name, opts, arrayBuffer)}
    //addFile(name, file, opts) {this._addFileData(name, opts, file)}
    addBlob(name, file, opts) {this._addFileData(name, opts, file)}
    addFolder(name, opts) {this._addFileData(name, opts)}
    _addFileData(name, opts, data) {this.fileData.push({name:name, opts:opts, ...this._mkExFileData(data)})}
    _mkExFileData(data) {
        if (data instanceof Uint8Array) { return {
            data: data,
            type: 'file',
            size: data.length,
        } }
        //else if (data instanceof File) { return {
        else if (data instanceof Blob) { return {// Blob/File
            data: data,
            type: 'file',
            size: data.size,
        } }
        else { return {// Folder(Directory)
            data: null,
            type: 'directory',
            size: 0,
        } }
    }
    _createBuffer() {
        let tarDataSize = 0;
        for(let i = 0; i < this.fileData.length; i++) {
            let size = this.fileData[i].size;
            tarDataSize += 512 + 512*Math.trunc(size/512);
            if(size % 512) {tarDataSize += 512;}
        }
        let bufSize = 10240*Math.trunc(tarDataSize/10240);
        if(tarDataSize % 10240) {bufSize += 10240;}
        this.buffer = new ArrayBuffer(bufSize); 
    }
    /*
    async download(filename) {
        //const blob = await this.writeBlob();
        const blob = await this.toBlob();
        const el = document.createElement('a');
        el.href = URL.createObjectURL(blob);
        el.download = filename;
        el.style.display = 'none';
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
    }
    */
    async download(fileName='some.tar') {
        const url = URL.createObjectURL(await this.toBlob());
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.download = fileName;
        a.href = url;
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
    //async writeBlob(onUpdate) {return new Blob([await this.write(onUpdate)], {'type':'application/x-tar'});}
    async toBlob(onUpdate) {return new Blob([await this.write(onUpdate)], {'type':'application/x-tar'});}
    write(onUpdate) {
        return new Promise((resolve,reject) => {
            this._createBuffer();
            let [offset, filesAdded] = [0,0];
            const onFileDataAdded = () => {
                filesAdded++;
                if (onUpdate) {onUpdate(filesAdded / this.fileData.length * 100);}
                if (filesAdded===this.fileData.length) {resolve(new Uint8Array(this.buffer))}
            };
            for(let fileIdx = 0; fileIdx < this.fileData.length; fileIdx++) {
                let fdata = this.fileData[fileIdx];
                // write header
                this._writeFileName(fdata.name, offset);
                this._writeFileType(fdata.type, offset);
                this._writeFileSize(fdata.size, offset);
                this._fillHeader(offset, fdata.opts, fdata.type);
                this._writeChecksum(offset);
                // write file data
                const destArray = new Uint8Array(this.buffer, offset+512, fdata.size);
                if(fdata.data instanceof Uint8Array) {
                    for(let byteIdx = 0; byteIdx < fdata.size; byteIdx++) {destArray[byteIdx] = fdata.data[byteIdx];}
                    onFileDataAdded();
                //} else if(fdata.data instanceof File) {
                } else if(fdata.data instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = (function(outArray) {
                        const dArray = outArray;
                        return function(event) {
                            let sbuf = event.target.result;
                            let sarr = new Uint8Array(sbuf);
                            for(let bIdx = 0; bIdx < sarr.length; bIdx++) {dArray[bIdx] = sarr[bIdx];}
                            onFileDataAdded();
                        };
                    })(destArray);
                    reader.readAsArrayBuffer(fdata.data);
                } else if('directory'===fdata.type) {onFileDataAdded();}
                offset += (512 + 512*Math.trunc(fdata.size/512));
                if(fdata.size % 512) {offset += 512;}
            }
        });
    }
    _writeString(str, offset, size) {
        const [strView, te] = [new Uint8Array(this.buffer, offset, size), new TextEncoder()];
        if (te.encodeInto) {
            const written = te.encodeInto(str, strView).written;
            for (let i=written; i<size; i++) {strView[i] = 0;}
        } else {
            const arr = te.encode(str);
            for (let i=0; i<size; i++) {strView[i] = i<arr.length ? arr[i] : 0;}
        }
    }
    _writeFileName(name, header_offset) {this._writeString(name, header_offset, 100);}// offset: 0
    _writeFileType(typeStr, header_offset) {// offset: 156
        const typeChar = 'directory'===typeStr ? '5' : '0'; // 0:file, 5:directory
        const typeView = new Uint8Array(this.buffer, header_offset + 156, 1);
        typeView[0] = typeChar.charCodeAt(0); 
    }
    _writeFileSize(size, header_offset) {this._writeString(size.toString(8).padStart(11,'0'), header_offset+124, 12)}
    _writeFileMode(mode, header_offset) {this._writeString(mode.padStart(7,'0'), header_offset+100, 8);}// offset: 100
    _writeFileUid(uid, header_offset) {this._writeString(uid.padStart(7,'0'), header_offset+108, 8);}// offset: 108
    _writeFileGid(gid, header_offset) {this._writeString(gid.padStart(7,'0'), header_offset+116, 8);}// offset: 116
    _writeFileMtime(mtime, header_offset) {this._writeString(mtime.padStart(11,'0'), header_offset+136, 12);}// offset: 136
    _writeFileUser(user, header_offset) {this._writeString(user, header_offset+265, 32);}// offset: 265
    _writeFileGroup(group, header_offset) {this._writeString(group, header_offset+297, 32);}// offset: 297
    _writeChecksum(header_offset) {// offset: 148
        this._writeString('        ', header_offset+148, 8); // first fill with spaces
        const header = new Uint8Array(this.buffer, header_offset, 512);// add up header bytes
        const chksum = [...new Array(512)].reduce((s,_,i)=>s+header[i], 0);
        this._writeString(chksum.toString(8), header_offset+148, 8);
    }
    _fillHeader(header_offset, opts, fileType) {
        opts ??= {};
        const [names, defVals] = ['uid gid mode mtime user group'.split(' '), [1000, 1000, 'file'===fileType ? '664' : '775', Date.now(), '', '']];
        const O = names.reduce((o,n,i)=>{o[n]=((n in opts) ? opts[n] : defVals[i]);return o}, {});
        this._writeFileMode(O.mode, header_offset);
        this._writeFileUid(O.uid.toString(8), header_offset);
        this._writeFileGid(O.gid.toString(8), header_offset);
        this._writeFileMtime(Math.trunc(O.mtime/1000).toString(8), header_offset);
        this._writeString('ustar', header_offset+257,6); // magic string
        this._writeString('00', header_offset+263,2); // magic version
        this._writeFileUser(O.user, header_offset);
        this._writeFileGroup(O.group, header_offset);
    }
}
// polyfill
//[Blob, Response].map(c=>c.prototype.bytes ??= async function() {return new Uint8Array(await this.arrayBuffer());});
//Blob.prototype.bytes ??= async function() {return new Uint8Array(await this.arrayBuffer());}
//Response.prototype.bytes ??= async function() {return new Uint8Array(await this.arrayBuffer());}
class TgzReader extends TarReader {
    constructor() {super()}
    async fromFile(tgzFile) {//tgzFile:Blob/File, ArrayBuffer, TypedArray, DataView, ReadableStream, URLSearchParams, String
        //const tar = await new Response(new Response(tar).body?.pipeThrough(new DecompressionStream('gzip'))).bytes();
        const tarBuf = await new Response(new Response(tgzFile).body?.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        return super.fromBuffer(tarBuf);
    }
    async fromBuffer(tgzBuf) {return this.fromFile(tgzBuf)}
//    const tar = gzip ? await new Response(new Response(tar).body?.pipeThrough(new DecompressionStream('gzip'))).bytes() : tar;
}
class TgzWriter extends TarWriter {
    constructor() {super()}
    async dowlonad(fileName) {return await this.download(fileName ?? 'some.tgz')}
    //async toBlob(onUpdate) {return new Blob([await this.write(onUpdate)], {'type':'application/x-tar'});}
    async toBlob(onUpdate) {
        await this.write(onUpdate);
        return new Blob([await new Response(new Response(this.buffer).body?.pipeThrough(new CompressionStream('gzip'))).bytes()], {'type':'application/x-gzip'});
    }
    // application/x-gzip        gz tgz
//    return gzip ? await new Response(new Response(tar).body?.pipeThrough(new CompressionStream('gzip'))).bytes() : tar;
}



// Module(Node.js/Browser)
const Tar = Object.freeze({Reader:TarReader, Writer:TarWriter});
const Tgz = Object.freeze({Reader:TgzReader, Writer:TgzWriter});

// Node.js(CommonJS)
if ('object'===typeof module && 'object'===typeof module.exports) {module.exports = Tgz;}
// Browser(use this instead of window, since window might not exist and throw and error)
else if ('object'===typeof this) {this.Tgz = Tgz;}
})();
