#!/usr/bin/env node

var filesystem_lib = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler_lib = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "https://mighty-fjord-9128.herokuapp.com"

var getHtmlContent, checkError;

var assertFileExists = function (infile) {
  var instr = infile.toString();
  if (!filesystem_lib.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1);
  }
  return instr;
};

var cheerioHtmlFile = function (htmlfile) {
  return cheerio.load(filesystem_lib.readFileSync(htmlfile));
};

var loadChecks = function (checksfile) {
  return JSON.parse(filesystem_lib.readFileSync(checksfile));
};

var checkHtml = function (htmlString, checksfile) {
  var checks, out, present;

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

getHtmlContent = function () {
  var htmlString = undefined; 
  if (checkError === undefined) {
    console.log('defining checkError');
    var checkError = function (requestResponse) {
      if (requestResponse instanceof Error) {
        console.error("Could not reach url %s", program.url);
        console.error(requestResponse.message);
        process.exit(1);
      }
      else {
       htmlString = requestResponse; 
      }
    }
  return checkError;
  }
  else {
    console.log('returning htmlString: ' + htmlString);
    return htmlString;
  }
}

if(require.main == module)
{
  program.option('-c, --checks <check_file>', 'Path to checks.json',
    clone(assertFileExists), CHECKSFILE_DEFAULT).option(
    '-f, --file <html_file>', 'Path to index.html. Cannot be used with --url', clone(assertFileExists),
    HTMLFILE_DEFAULT).option('-u, --url [url]', 'Url to web page to check. Cannot be used with --file', URL_DEFAULT).parse(process.argv);
  if (program.rawArgs.length > 6) {
    console.error("Too many arguments");
    program.help();
  }

  for (index = 2; index < program.rawArgs.length; index += 2) {
    if (toCheck === undefined && program.rawArgs[index] !== '--checks') {
      toCheck = program.rawArgs[index];
    }
    else if (program.rawArgs[index] !== '--checks') {
      console.error("wrong argument combination");
      program.help();
    }
  }

  toCheck = toCheck || '--file';

  checkError = getHtmlContent();

  if (toCheck === '--file') {
    htmlString = filesystem_lib.readFileSync(program.file);
  }
  else {
    htmlString = restler_lib.get(program.url).on('complete', checkError);
  }
 
  console.log(getHtmlContent());

  checkJson = checkHtml(htmlString, program.checks);
  outJson = JSON.stringify(checkJson, null, 4);
  console.log(outJson);
}
else
{
  exports.checkHtmlFile = checkHtmlFile;
}
