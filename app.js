var koa = require('koa');
var serve = require('koa-static');
var parse = require('co-busboy');
var fs = require('fs');
var path = require('path');
var Imagemin = require('imagemin');
var rename = require('gulp-rename');
var config = require('./config');
var app = koa();

app.use(serve(__dirname + '/public'));

app.use(function *(next) {
  yield next;
  if (this.body || !this.idempotent) {
    return;
  }

  this.redirect('/index.html');
});

app.use(function *(next) {
  if (!this.request.is('multipart/*')) {
    return yield next;
  }

  this.type = 'application/json';
  var err = '';
  var parts = parse(this, {
    checkFile: function(fieldname, file, filename) {
      if (config.allowFileType.indexOf(path.extname(filename)) === -1) {
        err = 'error file type';
        return false;
      }
    }
  });

  var part;
  var images = [];
  var outSrc = config.outSrc.endsWith('/') ? config.outSrc : config.outSrc + '/';

  while (part = yield parts) {
    if (err !== '') { //error occurred
      this.body = {
        rtn: -1,
        msg: err
      };
      return;
    }

    var date = new Date();
    var filenamePrefix = '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + date.getHours() + date.getMinutes() + date.getSeconds() + Math.floor(Math.random() * 10000);
    var targetFile = '';
    var originalFile = path.join(config.savePath, filenamePrefix + part.filename);
    var stream = fs.createWriteStream(originalFile);
    var fileType = path.extname(part.filename);
    part.pipe(stream);

    targetFile = path.join(filenamePrefix + fileType);
    images.push({
      originalFile: originalFile,
      targetFile: targetFile,
      fileType: fileType
    });
  }

  yield Promise.all(images.map(function(image) {
    return compressImage(image.originalFile, image.targetFile, image.fileType);
  })).then(function(data) {
    var compressImgs = data.filter(function(img) {
      return img !== '';
    });
    this.body = {
      rtn: 0,
      data: compressImgs
    };
  }.bind(this));

  function compressImage(originalFile, targetFile, fileType) {
    return new Promise(function(resolve, reject) {
      var img = new Imagemin().src(originalFile).use(rename(targetFile)).dest(config.outPath);

      switch (fileType) {
      case '.png':
        img.use(Imagemin.optipng({optimizationLevel: 3}));
        break;
      case '.jpg':
        img.use(Imagemin.jpegtran({progressive: true}));
        break;
      case '.gif':
        img.use(Imagemin.gifsicle({interlaced: true}));
        break;
      case '.svg':
        img.use(Imagemin.svgo());
        break;
      default:
        break;
      }

      img.run(function(err, file) {
        if (err) { //ignore error file
          return resolve('');
        }

        resolve(config.outSrc + targetFile);
      });
    });
  }
});

app.listen(3000);
