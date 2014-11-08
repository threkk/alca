#!/usr/bin/env node

var fs = require('fs');
var watchr = require('watchr');
var path = require('path');
var less = require('less');
var sys = require('sys');
var exec = require('child_process').exec;

var argvs  = process.argv.slice(2);
var input  = argvs[argvs.length-2];
var output = argvs[argvs.length-1];

function getOutputPath(filePath) {
    var diff = path.relative(input,filePath);
    return output + diff;
}

function createFile(filePath) {
    var str = filePath.split('.');
    var ext = str[str.length-1];
    if(ext === 'less') {
        var out = getOutputPath(filePath).slice(0, -4) + "css";
        options = {
            'encoding' : 'utf8',
            'flag' : 'r'
        };
        fs.readFile(filePath, options, function(err, data){
            if(err) {
                console.log(err);
                exit(1);
            } else {
                var parser = new(less.Parser)({
                    paths: ['.', input],
                    filename: filePath
                });
                parser.parse(data, function(err, tree) {
                    if(err) {
                        console.log(err);
                        exit(1);
                    } else {
                        css = tree.toCSS();
                        fs.writeFile(out, css, function(err) {
                            if(err) {
                                console.log(err);
                                exit(1);
                            } else {
                                var now = new Date();
                                console.log(now.toTimeString() + ' - Compiled file ' + out);
                            }
                        });
                    }
                });
            }
        });
    }
}

function deleteFile(filePath, remove, callback) {
    var out = getOutputPath(filePath).slice(0, -4) + "css";
    //var cmd = "rm -f " + out;

    fs.unlink(out, function(err) {
      if(err) {
          console.log(err);
      } else {
          var now = new Date();
          if(remove) console.log(now.toTimeString() + ' - Deleted ' + out);
          if(typeof callback == 'function')
            callback();
      }
    });
}

watchr.watch({
    path : input,
    interval : 3000,
    listener :function() {

        var change = arguments[0];
        var filePath = arguments[1];
        var now = new Date();

        switch(change) {
            case 'create' :
                console.log(now.toTimeString() + ' - Created: ' + filePath);
                createFile(filePath);
                break;
            case 'update' :
                console.log(now.toTimeString() + ' - Updated: ' + filePath);
                deleteFile(filePath, false, function(){
					createFile(filePath);
				});
                break;
            case 'delete' :
                console.log(now.toTimeString() + ' - Deleted: ' + filePath);
                deleteFile(filePath, true);
                break;
            default :
                console.log('Something is wrong.');
        }

    }
});
