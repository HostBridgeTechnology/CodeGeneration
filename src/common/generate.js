var fs = require('fs');
var mustache = require('mustache');

var t = __dirname.split(/[\/\\]/);
t.splice(-1,1);
var parent = t.join('/');

var copybookLiteV3cb    = fs.readFileSync(parent + '/templates/copybookLiteV3cb.txt').toString();
var copybookLiteV3js    = fs.readFileSync(parent + '/templates/copybookLiteV3js.txt').toString();
var copybookLiteV2cb    = fs.readFileSync(parent + '/templates/copybookLiteV2cb.txt').toString();
var copybookLiteV2js    = fs.readFileSync(parent + '/templates/copybookLiteV2js.txt').toString();
var copybookLite        = fs.readFileSync(parent + '/templates/copybookLite.txt').toString();
var copybookTemplate    = fs.readFileSync(parent + '/templates/copybookTemplate.txt').toString();


exports.getJs = function (file, zip) {

    // if (file.cli) {
        if (file.v4) {
            var codeV4 = xmlToHBJSV3(file.parsed, 'on', 'on', 'theProg', 'theService', file.v2Compatibility);

            if (file.js) {
                if (file.cli) {
                    fs.writeFileSync(file.outfile + '-v4js.hbx', codeV4.copybookLiteV3js);
                } else {
                    zip.append(codeV4.copybookLiteV3js, {name: `${file.prefix}-V4js.hbx`});
                }
            }

            if (file.cob) {
                if (file.cli) {
                    fs.writeFileSync(file.outfile + '-v4cb.hbx', codeV4.copybookLiteV3cb);
                } else {
                    zip.append(codeV4.copybookLiteV3cb, {name: `${file.prefix}-V4cb.hbx`});
                }
            }
        }
        if (file.v3) {
            var codeV3 = xmlToHBJSV2(file.parsed, 'on', 'on', 'theProg', 'theService', file.v2Compatibility);
   
            if (file.js) {
                if (file.cli) {
                    fs.writeFileSync(file.outfile + '-v3js.hbx', codeV3.copybookLiteV2js);
                } else {
                    zip.append(codeV3.copybookLiteV2js, {name: `${file.prefix}-V3js.hbx`});
                }
            }

            if (file.cob) {
                if (file.cli) {
                    fs.writeFileSync(file.outfile + '-v3cb.hbx', codeV3.copybookLiteV2cb);
                } else {
                    zip.append(codeV3.copybookLiteV2cb, {name: `${file.prefix}-V3cb.hbx`});
                }
            }
        }
        if (file.v2 || file.v1) {
            var codeV1 = xmlToHBJS(file.parsed, 'on', 'on', 'theProg', 'theService', file.v2Compatibility);

            if (file.v2) {
                if (file.cli) {
                    fs.writeFileSync(file.outfile + '-V2lite.hbx', codeV1.copybookLite);
                } else {
                    zip.append(codeV1.copybookLite, {name: `${file.prefix}-V2lite.hbx`});
                }
            }

            if (file.v1) {
                if (file.cli) {
                    fs.writeFileSync(file.outfile + '-V1full.hbx', codeV1.copybookFull);
                } else {
                    zip.append(codeV1.copybookFull, {name: `${file.prefix}-V1full.hbx`});
                }
            }
        }
    // } else {
    //     var codeV4 = xmlToHBJSV3(file.parsed, 'on', 'on', 'theProg', 'theService', file.v2Compatibility);
    //     zip.append(codeV4.copybookLiteV3cb, {name: `${file.prefix}-V4cb.hbx`});
    //     zip.append(codeV4.copybookLiteV3js, {name: `${file.prefix}-V4js.hbx`});

    //     var codeV3 = xmlToHBJSV2(file.parsed, 'on', 'on', 'theProg', 'theService', file.v2Compatibility);
    //     zip.append(codeV3.copybookLiteV2cb, {name: `${file.prefix}-V3cb.hbx`});
    //     zip.append(codeV3.copybookLiteV2js, {name: `${file.prefix}-V3js.hbx`});

    //     var codeV1 = xmlToHBJS(file.parsed, 'on', 'on', 'theProg', 'theService', file.v2Compatibility);
    //     zip.append(codeV1.copybookFull, {name: `${file.prefix}-V1full.hbx`});
    //     zip.append(codeV1.copybookLite, {name: `${file.prefix}-V2lite.hbx`});
    // }
}

function toJSName(n) {
    var i;
    n = n.toLowerCase();
    while ((i = n.indexOf('-')) > -1) {
        n = n.substring(0, i) + n.charAt(i+1).toUpperCase() + n.substring(i+2);
    }
    return (n);
}

/*
    * Attribute offsets
    */
const _offset = {
    type 		: 0,
    signed 		: 1,
    precision	: 2,
    scale		: 3,
    length 		: 4,
    position 	: 8, 
    occurs 		: 12,
    occParent	: 16,
    parent		: 20,
};

var cobolList, jsList;

function safeNames(cobolName) {
    var cobTemp = cobolName;
    var jsName = toJSName(cobolName);
    
    for (var wart = 1; cobolList[cobTemp]; wart++) cobTemp = cobolName + '_' + wart
    cobolList[cobTemp] = true;
    
    var jsTemp = jsName;
    for (var wart = 1; jsList[jsTemp]; wart++) jsTemp = jsName + '_' + wart
    jsList[jsTemp] = true;
    
    return ({cobol: cobTemp, js: jsTemp});
}

function padLeft(s, l, c) {
    return((c.repeat(l) + s.toString()).slice(-l));
}

function xmlToHBJSV3 (doc, includeFields, includeComments, program, service, v2Compatibility) {
    if (!program) program = 'MYPROG';
    if (!service) service = 'myService';
            
    cobolList = {};
    jsList = {};

    var parent = new Array();
    var occurParents = new Array();
    var fieldIndexMap = {};

    var view = {
        bufferName : toJSName(doc.item[0].$.name),
        includeFields : includeFields,
        includeComments : includeComments,
        bufferLength : doc.item[0].$['storage-length'],
        program : program,
        service : service,
        attributeFieldLength: 24,
        fields: new Array(), 
        v2Compatible : v2Compatibility == "on" ? true : false,
        v2noneCompatible : v2Compatibility != "on" ? true : false
    }

    walkXml(doc.item);

    for (var i=0; i<view.fields.length; i++) {
        fieldIndexMap[view.fields[i].jsName] = i;
    }

    for (var i=0; i<view.fields.length; i++) with (view.fields[i]) {
        var sb = Buffer.alloc(view.attributeFieldLength, 0);

        switch (type) {
            case 'GROUP':
                sb[_offset.type] = 0;
                break;
            case 'CHAR':
                sb[_offset.type] = 1;
                break;
            case 'BINARY':
                sb[_offset.type] = 2;
                break;
            case 'COMP3':
                sb[_offset.type] = 3;		
                break;
            case 'ZONED':
                sb[_offset.type] = 4;
                break;
            case 'FLOAT':
                sb[_offset.type] = 5;
                break;
            case 'DOUBLE':
                sb[_offset.type] = 6;
                break;
            case 'NUM-EDIT-DZ':
                sb[_offset.type] = 7;
                break;
            case 'NUM-EDIT-D9':
                sb[_offset.type] = 8;
                break;
            case 'NUM-EDIT-Z':
                sb[_offset.type] = 9;
                break;
            case 'NUM-EDIT-9':
                sb[_offset.type] = 10;
                break;
            default:
                sb[_offset.type] = 254;
        };

        if (signed) sb[_offset.signed] = 1;

        if (typeof(precision) != 'undefined') sb[_offset.precision] = Number(precision);

        if (scale) sb[_offset.scale] = Number(scale);

        sb.writeInt32BE(length, _offset.length);
        sb.writeInt32BE(position, _offset.position);

        if (typeof(occurs) == 'undefined') sb.writeInt32BE(1, _offset.occurs);
        else sb.writeInt32BE(occurs, _offset.occurs);

        if (occurParents.length > 2) {
            var tmp = eval(occurParents);
            sb.writeInt32BE(fieldIndexMap[tmp[tmp.length - 1]], _offset.occParent);
        }
        
        sb.writeInt32BE(fieldIndexMap[containedIn], _offset.parent);
        
        view.fields[i].attributes = '';

        for (var j=0; j<sb.length; j++) {
            view.fields[i].attributes += '\\x' + padLeft(sb[j].toString(16),2,'0');
        }
        view.fields[i].fieldIndex = i;
    }

    // var copybookLiteV3cb = fs.readFileSync(__dirname + '/copybookLiteV3cb.txt').toString();
    // var copybookLiteV3js = fs.readFileSync(__dirname + '/copybookLiteV3js.txt').toString();
    
    var results = {
        copybookLiteV3js: mustache.render(copybookLiteV3js, view),
        copybookLiteV3cb: mustache.render(copybookLiteV3cb, view)
    }

    return(results);

    function walkXml(f, parentName) {
        var containerChildren = new Array();
        for (var c = 0; c < f.length; c++) {
            view.fields[view.fields.length] = getField(f[c], parent, occurParents);
            var index = view.fields.length - 1;
            view.fields[index].parent = parentName;
            // Use the cobolName or the jsName for parents
            //if (view.fields[index].occurs > 1) occurParents.push("'" + view.fields[index].cobolName + "'");
            if (view.fields[index].occurs > 1) occurParents.push("'" + view.fields[index].jsName + "'");
            //parent.push(f[c].$.name);
            parent.push(view.fields[index].jsName);
            if (f[c].item) {
                view.fields[index].children = walkXml(f[c].item, view.fields[index].jsName).join(',');
            }
            parent.pop();
            if (view.fields[index].occurs > 1) occurParents.pop();
            containerChildren.push("'" + view.fields[index].jsName + "'");
        }
        return (containerChildren);
    }
    
    function getField(elm, parent, occurParents) {
        var names = safeNames(elm.$.name);
    
        if (elm.$.value == undefined) var initialValue = undefined;
        else 
        switch(elm.$.value) {
            case 'spaces' :
            case 'space' :
                var initialValue = ' '.repeat(Number(elm.$['storage-length']));
                break;
            case 'zeros' :
            case 'zero' :
                var initialValue = '0';
                break;
            default :
                var initialValue = elm.$.value;
        }
        
        var def = { 
            level 		: elm.$.level,
            jsName 		: names.js,
            cobolName	: names.cobol,        // elm.$.name,
            fullName	: parent.length > 0 ? parent.join('.') + '.' + elm.$.name 	: elm.$.name,
            containedIn : parent.length > 0 ? parent[parent.length - 1] : 0,
            position	: Number(elm.$.position) - 1,
            length		: elm.$['storage-length'],
            signed 		: elm.$.signed 					    != undefined ? 'true' 							: null,
            scale 		: elm.$.scale 					    != undefined ? elm.$.scale				    	: null,
            redefine	: elm.$.redefines	    			!= undefined ? elm.$.redefines 			    	: null,
            picture		: elm.$.picture 					!= undefined ? elm.$.picture 					: null,
            insDecimal	: elm.$['insert-decimal-point']     != undefined ? elm.$['insert-decimal-point']    : 'false',
            editted		: elm.$['editted-numeric']          != undefined ? elm.$['editted-numeric'] 		: 'false',
            numeric		: elm.$.numeric  			    	!= undefined ? elm.$.numeric					: 'false',
            usage		: elm.$.usage					    != undefined ? elm.$.usage		    			: '',
            initial		: initialValue                      != undefined ? initialValue                     : null,
            occurParents: '[' + occurParents.join(',') + ']'
        };
        
        def.scalar = 'true';
        def.dependingOn = 'false';
        if (elm.$.occurs != undefined) {
            def.scalar = 'false';
            def.occurs = Number(elm.$.occurs);
            if (elm.$['dependingOn'] != undefined) {
                def.dependingOn = 'true';
                def.min = elm.$['occurs-min'] 	!= undefined ? elm.$['occurs-min'] 	: 0;
                def.dependent = elm.$['depending-on'];
            }
        }
        
        if (occurParents.length > 0) def.scalar = 'false';
        def.occurParents = '[' + occurParents.join(',') + ']';
    
        if (elm.$.numeric == 'true') {
            def.precision = elm.$['display-length'];

            switch (true) {
                case def.usage == 'computational-3' :
                    def.type = 'COMP3';
                    break;
                    
                case def.usage == 'computational' :
                case def.usage == 'computational-5' :
                    def.type = 'BINARY';
                    break;
                
                case def.usage == 'computational-1' :
                    def.type = 'FLOAT';
                    break;
                    
                case def.usage == 'computational-2' :
                    def.type = 'DOUBLE';
                    break;
                    
                case def.signed == 'true' :
                    def.type = 'ZONED';
                    break;
                    
                case def.usage != '' :
                    def.type = def.usage.toUpperCase();
                    break;
                
                case def.insDecimal == 'true' :
                    def.type = def.picture.indexOf('Z') > -1 ? 'NUM-EDIT-DZ' : 'NUM-EDIT-D9';
                    def.signed = def.picture.slice(-1) == "-" ? "true" : null;
                    break;
                    
                case def.picture.indexOf('Z') > -1 :
                    def.type = 'NUM-EDIT-Z';
                    def.signed = def.picture.slice(-1) == "-" ? "true" : null;
                    break;
                    
                default :
                    def.type = 'NUM-EDIT-9';
                    def.signed = def.picture.slice(-1) == "-" ? "true" : null;
                    
            }
        }
        else def.type = elm.$.picture != undefined ? 'CHAR' : 'GROUP';
        return(def);
    }
}

function xmlToHBJSV2 (doc, includeFields, includeComments, program, service, v2Compatibility) {
    if (!program) program = 'MYPROG';
    if (!service) service = 'myService';
            
    cobolList = {};
    jsList = {};

    var parent = new Array();
    var occurParents = new Array();
    var fieldIndexMap = {};

    var view = {
        bufferName : toJSName(doc.item[0].$.name),
        includeFields : includeFields,
        includeComments : includeComments,
        bufferLength : doc.item[0].$['storage-length'],
        program : program,
        service : service,
        attributeFieldLength: 24,
        fields: new Array(), 
        v2Compatible : v2Compatibility == "on" ? true : false,
        v2noneCompatible : v2Compatibility != "on" ? true : false
    }

    walkXml(doc.item);

    // var template = require('templating', 'codegen');

    for (var i=0; i<view.fields.length; i++) {
        fieldIndexMap[view.fields[i].jsName] = i;
    }

    for (var i=0; i<view.fields.length; i++) with (view.fields[i]) {
        var sb = Buffer.alloc(view.attributeFieldLength, 0);

        switch (type) {
            case 'GROUP':
                sb[_offset.type] = 0;
                break;
            case 'CHAR':
                sb[_offset.type] = 1;
                break;
            case 'BINARY':
                sb[_offset.type] = 2;
                break;
            case 'COMP3':
                sb[_offset.type] = 3;	
                break;
            case 'ZONED':
                sb[_offset.type] = 4;
                break;
            case 'FLOAT':
                sb[_offset.type] = 5;
                break;
            case 'DOUBLE':
                sb[_offset.type] = 6;
                break;
            default:
                sb[_offset.type] = 9;
        };

        if (signed) sb[_offset.signed] = 1;

        if (typeof(precision) != 'undefined') sb[_offset.precision] = Number(precision);

        if (scale) sb[_offset.scale] = Number(scale);

        sb.writeInt32BE(length, _offset.length);
        sb.writeInt32BE(position, _offset.position);

        if (typeof(occurs) == 'undefined') sb.writeInt32BE(1, _offset.occurs);
        else sb.writeInt32BE(occurs, _offset.occurs);

        if (occurParents.length > 2) {
            var tmp = eval(occurParents);
            sb.writeInt32BE(fieldIndexMap[tmp[tmp.length - 1]], _offset.occParent);
        }
        
        sb.writeInt32BE(fieldIndexMap[containedIn], _offset.parent);
        
        view.fields[i].attributes = '';

        for (var j=0; j<sb.length; j++) {
            view.fields[i].attributes += '\\x' + padLeft(sb[j].toString(16),2,'0');
        }
        view.fields[i].fieldIndex = i;
    }
    
    // var copybookLiteV2cb = fs.readFileSync(__dirname + '/copybookLiteV2cb.txt').toString();
    // var copybookLiteV2js = fs.readFileSync(__dirname + '/copybookLiteV2js.txt').toString();
    // var copybookLiteV2js = load('copybookLiteV2js.txt','codegen').toString();
    // var copybookLiteV2cb = load('copybookLiteV2cb.txt','codegen').toString();
    
    var results = {
        copybookLiteV2js: mustache.render(copybookLiteV2js, view),
        copybookLiteV2cb: mustache.render(copybookLiteV2cb, view)
    }

    return(results);

    function walkXml(f, parentName) {
        var containerChildren = new Array();
        for (var c = 0; c < f.length; c++) {
            view.fields[view.fields.length] = getField(f[c], parent, occurParents);
            var index = view.fields.length - 1;
            view.fields[index].parent = parentName;
            // Use the cobolName or the jsName for parents
            //if (view.fields[index].occurs > 1) occurParents.push("'" + view.fields[index].cobolName + "'");
            if (view.fields[index].occurs > 1) occurParents.push("'" + view.fields[index].jsName + "'");
            //parent.push(f[c].$.name);
            parent.push(view.fields[index].jsName);
            if (f[c].item) {
                view.fields[index].children = walkXml(f[c].item, view.fields[index].jsName).join(',');
            }
            parent.pop();
            if (view.fields[index].occurs > 1) occurParents.pop();
            containerChildren.push("'" + view.fields[index].jsName + "'");
        }
        return (containerChildren);
    }
    
    function getField(elm, parent, occurParents) {
        var names = safeNames(elm.$.name);
    
        if (elm.$.value == undefined) var initialValue = undefined;
        else 
        switch(elm.$.value) {
            case 'spaces' :
            case 'space' :
                var initialValue = ' '.repeat(Number(elm.$['storage-length']))
                break;
            case 'zeros' :
            case 'zero' :
                var initialValue = '0';
                break;
            default :
                var initialValue = elm.$.value;
        }
        
        var def = { 
            level 		: elm.$.level,
            jsName 		: names.js,
            cobolName	: names.cobol,        // elm.$.name,
            fullName	: parent.length > 0 ? parent.join('.') + '.' + elm.$.name 	: elm.$.name,
            containedIn : parent.length > 0 ? parent[parent.length - 1] : 0,
            position	: Number(elm.$.position) - 1,
            length		: elm.$['storage-length'],
            signed 		: elm.$.signed 			!= undefined ? 'true' 							: undefined,
            scale 		: elm.$.scale 			!= undefined ? elm.$.scale			: undefined,
            redefine	: elm.$.redefines		!= undefined ? elm.$.redefines 		: undefined,
            picture		: elm.$.picture 			!= undefined ? elm.$.picture 			: undefined,
            initial		: initialValue,
            occurParents: '[' + occurParents.join(',') + ']'
        };
        
        def.scalar = 'true';
        def.dependingOn = 'false';
        if (elm.$.occurs != undefined) {
            def.scalar = 'false';
            def.occurs = Number(elm.$.occurs);
            if (elm.$['dependingOn'] != undefined) {
                def.dependingOn = 'true';
                def.min = elm.$['occurs-min'] 	!= undefined ? elm.$['occurs-min'] 	: 0;
                def.dependent = elm.$['depending-on'];
            }
        }
        
        if (occurParents.length > 0) def.scalar = 'false';
        def.occurParents = '[' + occurParents.join(',') + ']';
    
        if (elm.$.numeric == 'true') {
            def.precision = elm.$['display-length'];
            
            switch (elm.$.usage) {
                case 'computational-3' :
                    def.type = 'COMP3';
                    break;
                case 'computational' :
                case 'computational-5' :
                case 'binary' :
                    def.type = 'BINARY';
                    break;
                // case undefined :
                //     console.dir(elm);
                //     def.type = elm.$.usage.toUpperCase();
                //     break;
                case 'computational-1':
                    def.type = 'FLOAT';
                    break;
                case 'computational-2':
                    def.type = 'DOUBLE';
                    break;
                default :
                    def.type = 'ZONED';
            }
        }
        else def.type = elm.$.picture != undefined ? 'CHAR' : 'GROUP';
        return(def);
    }
}

function xmlToHBJS (doc, includeFields, includeComments, program, service) {
    if (!program) program = 'MYPROG';
    if (!service) service = 'myService';
            
    cobolList = {};
    jsList = {};

    var parent = new Array();
    var occurParents = new Array();
    var fieldIndexMap = {};

    var view = {
        bufferName : toJSName(doc.item[0].$.name),
        includeFields : includeFields,
        includeComments : includeComments,
        bufferLength : doc.item[0].$['storage-length'],
        program : program,
        service : service,
        attributeFieldLength: 20,
        fields: new Array()
    }

    walkXml(doc.item);

    // var template = require('templating', 'codegen');

    for (var i=0; i<view.fields.length; i++) {
        fieldIndexMap[view.fields[i].jsName] = i;
    }

    for (var i=0; i<view.fields.length; i++) with (view.fields[i]) {
        var sb = Buffer.alloc(view.attributeFieldLength, 0);

        switch (type) {
            case 'CHAR':
            case 'GROUP':
                sb[_offset.type] = 0;
                break;
            case 'BINARY':
                sb[_offset.type] = 1;
                break;
            case 'COMP3':
                sb[_offset.type] = 2;		
                break;
            case 'ZONED':
                sb[_offset.type] = 3;
                break;
            case 'FLOAT':
                sb[_offset.type] = 5;
                break;
            case 'DOUBLE':
                sb[_offset.type] = 6;
                break;
            default:
                sb[_offset.type] = 9;
        };

        if (signed) sb[_offset.signed] = 1;

        if (typeof(precision) != 'undefined') sb[_offset.precision] = Number(precision);

        if (scale) sb[_offset.scale] = Number(scale);

        sb.writeInt32BE(length, _offset.length);
        sb.writeInt32BE(position, _offset.position);

        if (typeof(occurs) == 'undefined') sb.writeInt32BE(1, _offset.occurs);
        else sb.writeInt32BE(occurs, _offset.occurs);

        if (occurParents.length > 2) {
            var tmp = eval(occurParents);
            sb.writeInt32BE(fieldIndexMap[tmp[tmp.length - 1]], _offset.occParent);
        }

        view.fields[i].attributes = '';

        for (var j=0; j<sb.length; j++) {
            view.fields[i].attributes += '\\x' + padLeft(sb[j].toString(16),2,'0');
        }
        view.fields[i].fieldIndex = i;
    }

    // var copybookLite = fs.readFileSync(__dirname + '/copybookLite.txt').toString();
    // var copybookTemplate = fs.readFileSync(__dirname + '/copybookTemplate.txt').toString();
    // var copybookLite = load('copybookLite.txt','codegen').toString();
    // var copybookTemplate = load('copybookTemplate.txt','codegen').toString();
    
    var results = {
        copybookFull: mustache.render(copybookTemplate, view),
        copybookLite: mustache.render(copybookLite, view)
    }

    return(results);

    function walkXml(f, parentName) {
        var containerChildren = new Array();
        for (var c = 0; c < f.length; c++) {
            view.fields[view.fields.length] = getField(f[c], parent, occurParents);
            var index = view.fields.length - 1;
            view.fields[index].parent = parentName;
            // Use the cobolName or the jsName for parents
            //if (view.fields[index].occurs > 1) occurParents.push("'" + view.fields[index].cobolName + "'");
            if (view.fields[index].occurs > 1) occurParents.push("'" + view.fields[index].jsName + "'");
            parent.push(f[c].$.name);	
            if (f[c].item) {
                view.fields[index].children = walkXml(f[c].item, view.fields[index].jsName).join(',');
            }
            parent.pop();
            if (view.fields[index].occurs > 1) occurParents.pop();
            containerChildren.push("'" + view.fields[index].jsName + "'");
        }
        return (containerChildren);
    }
    
    function getField(elm, parent, occurParents) {
        var names = safeNames(elm.$.name);
    
        if (elm.$.value == undefined) var initialValue = undefined;
        else 
        switch(elm.$.value) {
            case 'spaces' :
            case 'space' :
                var initialValue = ' '.repeat(Number(elm.$['storage-length']))
                break;
            case 'zeros' :
            case 'zero' :
                var initialValue = '0';
                break;
            default :
                var initialValue = elm.$.value;
        }
        
        var def = { 
            level 		: elm.$.level,
            jsName 		: names.js,
            cobolName	: names.cobol,        // elm.$.name,
            fullName	: parent.length > 0 ? parent.join('.') + '.' + elm.$.name 	: elm.$.name,
            containedIn : parent.length > 0 ? parent[parent.length - 1] : 0,
            position	: Number(elm.$.position) - 1,
            length		: elm.$['storage-length'],
            signed 		: elm.$.signed 			!= undefined ? 'true' 							: undefined,
            scale 		: elm.$.scale 			!= undefined ? elm.$.scale			: undefined,
            redefine	: elm.$.redefines		!= undefined ? elm.$.redefines 		: undefined,
            picture		: elm.$.picture 			!= undefined ? elm.$.picture 			: undefined,
            initial		: initialValue,
            occurParents: '[' + occurParents.join(',') + ']'
        };
        
        def.scalar = 'true';
        def.dependingOn = 'false';
        if (elm.$.occurs != undefined) {
            def.scalar = 'false';
            def.occurs = Number(elm.$.occurs);
            if (elm.$['dependingOn'] != undefined) {
                def.dependingOn = 'true';
                def.min = elm.$['occurs-min'] 	!= undefined ? elm.$['occurs-min'] 	: 0;
                def.dependent = elm.$['depending-on'];
            }
        }
        
        if (occurParents.length > 0) def.scalar = 'false';
        def.occurParents = '[' + occurParents.join(',') + ']';
    
        if (elm.$.numeric == 'true') {
            def.precision = elm.$['display-length'];
            
            switch (elm.$.usage) {
                case 'computational-3' :
                    def.type = 'COMP3';
                    break;
                case 'computational' :
                case 'computational-5' :
                case 'binary' :
                    def.type = 'BINARY';
                    break;
                // case undefined :
                //     def.type = elm.$.usage.toUpperCase();
                //     break;
                case 'computational-1':
                    def.type = 'FLOAT';
                    break;
                case 'computational-2':
                    def.type = 'DOUBLE';
                    break;
                default :
                    def.type = 'ZONED';
            }
        }
        else def.type = elm.$.picture != undefined ? 'CHAR' : 'GROUP';
        return(def);
    }
}


