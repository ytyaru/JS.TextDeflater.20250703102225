// https://raw.githubusercontent.com/ankitrohatgi/tarballjs/refs/heads/master/tarball.js
(function(){
class TarReader {
    constructor() {this._fileInfo = [];}
    get fileInfo() {return this._fileInfo}
    readFile(file) {
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
    readArrayBuffer(arrayBuffer) {
        this.buffer = arrayBuffer;
        this._fileInfo = [];
        this._readFileInfo();
        return this._fileInfo;
    }
    _readFileInfo() {
        this._fileInfo = [];
        let [offset, fileSize, fileName, fileType] = [0,0,'',null];
        while(offset < this.buffer.byteLength - 512) {
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
//        let szView = new Uint8Array(this.buffer, header_offset+124, 12);// offset: 124
//        let szStr = '';
//        for(let i = 0; i < 11; i++) {
//            szStr += String.fromCharCode(szView[i]);
//        }
//        return parseInt(szStr,8);
    }
    _readFileBlob(file_offset, size, mimetype) {return new Blob([new Uint8Array(this.buffer, file_offset, size)], {type: mimetype})};
/*
    _readFileBlob(file_offset, size, mimetype) {
        let view = new Uint8Array(this.buffer, file_offset, size);
        let blob = new Blob([view], {type: mimetype});
        return blob;
    }
*/
    _readFileBinary(file_offset, size) {return new Uint8Array(this.buffer, file_offset, size)}
/*
    _readFileBinary(file_offset, size) {
        let view = new Uint8Array(this.buffer, file_offset, size);
        return view;
    }
*/
    _readTextFile(file_offset, size) {return new TextDecoder().decode(new Uint8Array(this.buffer, file_offset, size))}
    /*
    _readTextFile(file_offset, size) {
        let view = new Uint8Array(this.buffer, file_offset, size);
        let td = new TextDecoder();
        return td.decode(view);
    }
    */
    getTextFile(fileName) {
        const info = this._fileInfo.find(info=>fileName===info.name);
        if (info) {return this._readTextFile(info.header_offset+512, info.size);}
    }
    getFileBlob(fileName, mimetype) {
        const info = this._fileInfo.find(info=>fileName===info.name);
        if (info) {return this._readFileBlob(info.header_offset+512, info.size, mimetype);}
    }
    getFileBinary(fileName) {
        const info = this._fileInfo.find(info=>fileName===info.name);
        if (info) {return this._readFileBinary(info.header_offset+512, info.size);}
    }

    /*
    getTextFile(fileName) {
        let info = this._fileInfo.find(info => info.name == fileName);
        if (info) {
            return this._readTextFile(info.header_offset+512, info.size); 
        }
    }

    getFileBlob(fileName, mimetype) {
        let info = this._fileInfo.find(info => info.name == fileName);
        if (info) {
            return this._readFileBlob(info.header_offset+512, info.size, mimetype); 
        }
    }

    getFileBinary(fileName) {
        let info = this._fileInfo.find(info => info.name == fileName);
        if (info) {
            return this._readFileBinary(info.header_offset+512, info.size); 
        }
    }

    */

}
class TarWriter {
    constructor() {this.fileData = [];}
    _mkFileData(name, opts, data) {return {name:name, opts:opts, ...this._mkExFileData(data)}}
    _mkExFileData(data) {
        if (data instanceof Uint8Array) { return {
            data: data,
//            array: data,
            type: 'file',
//            dataType: 'array',
            size: data.length,
        } }
        else if (data instanceof File) { return {
            data: data,
//            file: data,
            type: 'file',
//            dataType: 'file',
            size: data.size,
        } }
        else { return {// Folder(Directory)
            data: null,
            type: 'directory',
//            dataType: 'none',
            size: 0,
        } }
    }
    /*
    // name, opts, 
    _mkExFileData(data) {
        if (data instanceof Uint8Array) { return {
            array: data,
            type: 'file',
            dataType: 'array',
            size: data.length,
        } }
        else if (data instanceof File) { return {
            file: data,
            type: 'file',
            dataType: 'file',
            size: data.size,
        } }
        else { return {// Folder(Directory)
            type: 'directory',
            dataType: 'none',
            size: 0,
        } }
    }
    */
    
    addTextFile(name, text, opts) {this.fileData.push(this._mkFileData(name, opts, new TextEncoder().encode(text)))}
    addFileArrayBuffer(name, arrayBuffer, opts) {this.fileData.push(this._mkFileData(name, opts, arrayBuffer))}
    addFile(name, file, opts) {this.fileData.push(this._mkFileData(name, opts, file))}
    addFolder(name, opts) {this.fileData.push(this._mkFileData(name, opts))}
    /*
    addTextFile(name, text, opts) {
        this.fileData.push({
            name: name,
            array: new TextEncoder().encode(text),
            type: 'file',
            size: arr.length,
            dataType: 'array',
            opts: opts
        });
    }
    addFileArrayBuffer(name, arrayBuffer, opts) {
        this.fileData.push({
            name: name,
            array: new Uint8Array(arrayBuffer),
            type: 'file',
            size: arr.length,
            dataType: 'array',
            opts: opts
        });
    }
    addFile(name, file, opts) {
        this.fileData.push({
            name: name,
            file: file,
            size: file.size,
            type: 'file',
            dataType: 'file',
            opts: opts
        });
    }
    addFolder(name, opts) {
        this.fileData.push({
            name: name,
            type: 'directory',
            size: 0,
            dataType: 'none',
            opts: opts
        });
    }
    */
    _createBuffer() {
        let tarDataSize = 0;
        for(let i = 0; i < this.fileData.length; i++) {                        
            let size = this.fileData[i].size;
            tarDataSize += 512 + 512*Math.trunc(size/512);
            if(size % 512) {
                tarDataSize += 512;
            }
        }
        let bufSize = 10240*Math.trunc(tarDataSize/10240);
        if(tarDataSize % 10240) {
            bufSize += 10240;
        }
        this.buffer = new ArrayBuffer(bufSize); 
    }

    async download(filename) {
        let blob = await this.writeBlob();
        let $downloadElem = document.createElement('a');
        $downloadElem.href = URL.createObjectURL(blob);
        $downloadElem.download = filename;
        $downloadElem.style.display = 'none';
        document.body.appendChild($downloadElem);
        $downloadElem.click();
        document.body.removeChild($downloadElem);
    }

    async writeBlob(onUpdate) {
        return new Blob([await this.write(onUpdate)], {'type':'application/x-tar'});
    }

    write(onUpdate) {
        return new Promise((resolve,reject) => {
            this._createBuffer();
            let [offset, filesAdded] = [0,0];
//            let offset = 0;
//            let filesAdded = 0;
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
                //if(fdata.dataType === "array") {
                if(fdata.data instanceof Uint8Array) {
                    for(let byteIdx = 0; byteIdx < fdata.size; byteIdx++) {
                        //destArray[byteIdx] = fdata.array[byteIdx];
                        destArray[byteIdx] = fdata.data[byteIdx];
                    }
                    onFileDataAdded();
                } else if(fdata.data instanceof File) {
                //} else if(fdata.dataType === "file") {
                    let reader = new FileReader();
                    
                    reader.onload = (function(outArray) {
                        const dArray = outArray;
                        return function(event) {
                            let sbuf = event.target.result;
                            let sarr = new Uint8Array(sbuf);
                            for(let bIdx = 0; bIdx < sarr.length; bIdx++) {
                                dArray[bIdx] = sarr[bIdx];
                            }
                            onFileDataAdded();
                        };
                    })(destArray);
                    //reader.readAsArrayBuffer(fdata.file);
                    reader.readAsArrayBuffer(fdata.data);
                } else if('directory'===fdata.type) {onFileDataAdded();}
                offset += (512 + 512*Math.trunc(fdata.size/512));
                if(fdata.size % 512) {offset += 512;}
            }
        });
    }

    _writeString(str, offset, size) {
        let strView = new Uint8Array(this.buffer, offset, size);
        let te = new TextEncoder();
        if (te.encodeInto) {
            // let the browser write directly into the buffer
            let written = te.encodeInto(str, strView).written;
            for (let i = written; i < size; i++) {
                strView[i] = 0;
            }
        } else {
            // browser can't write directly into the buffer, do it manually
            let arr = te.encode(str);
            for (let i = 0; i < size; i++) {
                strView[i] = i < arr.length ? arr[i] : 0;
            }
        }
    }

    _writeFileName(name, header_offset) {
        // offset: 0
        this._writeString(name, header_offset, 100);
    }

    _writeFileType(typeStr, header_offset) {
        // offset: 156
        let typeChar = "0";
        if(typeStr === "file") {
            typeChar = "0";
        } else if(typeStr === "directory") {
            typeChar = "5";
        }
        let typeView = new Uint8Array(this.buffer, header_offset + 156, 1);
        typeView[0] = typeChar.charCodeAt(0); 
    }

    _writeFileSize(size, header_offset) {
        // offset: 124
        let sz = size.toString(8);
        sz = this._leftPad(sz, 11);
        this._writeString(sz, header_offset+124, 12);
    }

    _leftPad(number, targetLength) {
        let output = number + '';
        while (output.length < targetLength) {
            output = '0' + output;
        }
        return output;
    }

    _writeFileMode(mode, header_offset) {
        // offset: 100
        this._writeString(this._leftPad(mode,7), header_offset+100, 8);         
    }

    _writeFileUid(uid, header_offset) {
        // offset: 108
        this._writeString(this._leftPad(uid,7), header_offset+108, 8);
    }
    
    _writeFileGid(gid, header_offset) {
        // offset: 116
        this._writeString(this._leftPad(gid,7), header_offset+116, 8);
    }

    _writeFileMtime(mtime, header_offset) {
        // offset: 136
        this._writeString(this._leftPad(mtime,11), header_offset+136, 12);
    }

    _writeFileUser(user, header_offset) {
        // offset: 265
        this._writeString(user, header_offset+265, 32);
    }
    
    _writeFileGroup(group, header_offset) {
        // offset: 297
        this._writeString(group, header_offset+297, 32);
    }

    _writeChecksum(header_offset) {
        // offset: 148
        this._writeString("        ", header_offset+148, 8); // first fill with spaces

        // add up header bytes
        let header = new Uint8Array(this.buffer, header_offset, 512);
        let chksum = 0;
        for(let i = 0; i < 512; i++) {
            chksum += header[i];
        }
        this._writeString(chksum.toString(8), header_offset+148, 8);
    }

    _getOpt(opts, opname, defaultVal) {
        if(opts != null) {
            if(opts[opname] != null) {
                return opts[opname];
            }
        }
        return defaultVal;
    }
    
    _fillHeader(header_offset, opts, fileType) {
        opts ??= {};
        const [names, defVals] = ['uid gid mode mtime user group'.split(' '), [1000, 1000, 'file'===fileType ? '664' : '775', Date.now(), '', '']];
//        const O = names.reduce((o,n,i)=>o[n]=opts[n] ?? defVals[i], {});
        console.log(opts)
        //const O = names.reduce((o,n,i)=>o[n]=((n in opts) ? opts[n] : defVals[i]), {});
        const O = names.reduce((o,n,i)=>{o[n]=((n in opts) ? opts[n] : defVals[i]);return o}, {});
        /*
        const O = names.reduce((o,n,i)=>{
            o[n]=((n in opts) ? opts[n] : defVals[i]);
            return o;
        }, {});
        */
        this._writeFileMode(O.mode, header_offset);
        this._writeFileUid(O.uid.toString(8), header_offset);
        this._writeFileGid(O.gid.toString(8), header_offset);
        this._writeFileMtime(Math.trunc(O.mtime/1000).toString(8), header_offset);
        this._writeString('ustar', header_offset+257,6); // magic string
        this._writeString('00', header_offset+263,2); // magic version
        this._writeFileUser(O.user, header_offset);
        this._writeFileGroup(O.group, header_offset);
        /*
        let uid = this._getOpt(opts, "uid", 1000);
        let gid = this._getOpt(opts, "gid", 1000);
        let mode = this._getOpt(opts, "mode", fileType === "file" ? "664" : "775");
        let mtime = this._getOpt(opts, "mtime", Date.now());
        let user = this._getOpt(opts, "user", "tarballjs");
        let group = this._getOpt(opts, "group", "tarballjs");

        this._writeFileMode(mode, header_offset);
        this._writeFileUid(uid.toString(8), header_offset);
        this._writeFileGid(gid.toString(8), header_offset);
        this._writeFileMtime(Math.trunc(mtime/1000).toString(8), header_offset);

        this._writeString("ustar", header_offset+257,6); // magic string
        this._writeString("00", header_offset+263,2); // magic version

        this._writeFileUser(user, header_offset);
        this._writeFileGroup(group, header_offset);
        */
    }

}
// Module(Node.js/Browser)
const Tar = Object.freeze({
    Reader: TarReader,
    Writer: TarWriter,
});
// Node.js(CommonJS)
if ('object'===typeof module && 'object'===typeof module.exports) {module.exports = Tar;}
// Browser(use this instead of window, since window might not exist and throw and error)
else if ('object'===typeof this) {this.Tar = Tar;}
})();
