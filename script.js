import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'path';

var __dirname = import.meta.dirname;
var projectPath = join(__dirname, 'student-code');

var checkW3CCss = async (projectPath) => {
  var makeErrorMessage = (error, fileName) => {
    var str = 'CSS validation error: ';

    str += error.message && `\`${error.message}\``;

    str += error.lastLine && ` on line: \`${error.lastLine}\`.`;

    str += fileName && ` File: \`${fileName}\``;

    return str;
  };

  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  var searchFile = async (path, fileName, result) => {
    result = result || new Set();

    var files = await readdir(path, { withFileTypes: true });

    for (var file of files) {
      var filePath = join(path, file.name);

      if (file.isDirectory()) {
        await searchFile(filePath, fileName, result);
      } else if (file.name.includes(fileName)) {
        result.add(filePath);
      }
    }

    return [...result];
  };

  var getUsersSeries = async (filePaths) => {
    var errors = new Set();

    for (var filePath of filePaths) {
      var cssContent = await readFile(filePath, 'utf-8');

      var response = await fetch('https://validator.w3.org/nu/?out=json', {
        headers: {
          'Content-Type': 'text/css; charset=utf-8',
          'User-Agent':
            'Mozilla/5.0 (platform; rv:geckoversion) Gecko/geckotrail Firefox/firefoxversion',
        },
        method: 'POST',
        body: cssContent,
      });

      var results = await response.json();

      var errorMessages = results.messages
        ?.filter((m) => m.type === 'error')
        .map((e) => makeErrorMessage(e, basename(filePath)));

      errors.add(...errorMessages);
      console.log('-> processing:', basename(filePath));
      await sleep(500);
    }

    return [...errors];
  };

  var cssPaths = await searchFile(projectPath, '.css');
  console.log('-> found css files:', cssPaths);

  return await getUsersSeries(cssPaths);
};

var err = await checkW3CCss(projectPath);

console.log('\n-> found errors:', err);
