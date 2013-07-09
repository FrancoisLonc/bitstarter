#!/usr/bin/env node

var filesystem_lib = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var http_lib = require('http');
var url_lib = require('url');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://mighty-fjord-9128.herokuapp.com"
var TMP_URL_FILE = "temp_index.html";

var error, printResponse, htmlString;

var assertFileExists = function (infile) {
  var instr = infile.toString();
  if (!filesystem_lib.existsSync(instr)) {
    console.error("%s does not exist. Exiting.", instr);
    process.exit(1);
  }
  return instr;
};

var loadChecks = function (checksfile) {
  return JSON.parse(filesystem_lib.readFileSync(checksfile));
};

var checkHtml = function (htmlString, checksfile) {
  var $, checks, out, present;

  $ = cheerio.load(htmlString);
  checks = loadChecks(checksfile).sort();
  out = {};
  for (var ii in checks)
  {
    present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var clone = function (fn) {
  return fn.bind({});
};

var checkJson, outJson, toCheck;

error = function(response) {
  console.error("Could not reach url %s", program.url);
  console.error(response.message);
  process.exit(1);
};

printResponse = function (result) {
  result.setEncoding('utf8');
  result.on('data', function (chunk) {
    filesystem_lib.writeFile("temp_index.html", chunk, function (error) {
      if (error) {
        console.error("Couldn't write file");
        process.exit(1);
      }
    });
  }).on('end', function () {
    filesystem_lib.readFile("temp_index.html", function (error, data) {
      var checkJson, outJson;
      if (error) {
        console.error("Couldn't read file");
        process.exit(1);
      }
      else {
        checkJson = checkHtml(data, program.checks);
        outJson = JSON.stringify(checkJson, null, 4);
        
        console.log(outJson);
      }
    });
  });
};

if(require.main == module)
{
  program.option('-c, --checks <check_file>', 'Path to checks.json',
    clone(assertFileExists), CHECKSFILE_DEFAULT).option(
    '-f, --file <html_file>', 'Path to index.html. Cannot be used with --url',
clone(assertFileExists), HTMLFILE_DEFAULT)
.option('-u, --url [url]', 'Url to web page to check. Cannot be used with --file', URL_DEFAULT).parse(process.argv);
  if (program.rawArgs.length > 6) {
    console.error("Too many arguments");
    program.help();
  }

  for (index = 2; index < program.rawArgs.length; index += 2) {
    if (toCheck === undefined && !(/-c/.test(program.rawArgs[index]))) {
      toCheck = program.rawArgs[index];
    }
    else if (!(/-c/.test(program.rawArgs[index]))) {
      console.error("wrong argument combination");
      program.help();
    }
  }

  toCheck = toCheck || '--file';

  if (/-f/.test(toCheck)) {
    htmlString = filesystem_lib.readFileSync(program.file);
    checkJson = checkHtml(htmlString, program.checks);
    outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  }
  else {
    clientRequest = http_lib.get(program.url, printResponse)
     .on('error', error);
  }
}
else {
  exports.checkHtmlFile = checkHtmlFile;
}
