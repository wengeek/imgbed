var path = require('path');

module.exports = {
  savePath: path.join(__dirname, '../tmp'), //where original images save
  outPath: path.join(__dirname, '../public/image'), //where compressed image save
  outSrc: 'http://localhost:3000/image/', //Image src,
  allowFileType: [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg'
  ] //the filetype which allow upload
};
