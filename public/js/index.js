
document.addEventListener('DOMContentLoaded', function() {
  var $document = document.documentElement;
  var $drag = document.getElementById('drag');
  var $upload = document.getElementById('upload');
  var $tip = document.getElementById('tip');
  var $preview = document.getElementById('preview');
  var clipboard;

  //prevent the browser open the image
  $document.addEventListener('dragleave', function(e) {
    e.preventDefault();
  }, false);
  $document.addEventListener('drop', function(e) {
    e.preventDefault();
  }, false);
  $document.addEventListener('dragenter', function(e) {
    e.preventDefault();
  }, false);
  $document.addEventListener('dragover', function(e) {
    e.preventDefault();
  }, false);

  $drag.addEventListener('drop', function(e) {
    e.preventDefault();
    var fileList = e.dataTransfer.files;

    uploadFile(fileList);
  }, false);

  $upload.addEventListener('change', function(e) {
    var files = [];
    e.preventDefault();
    e.stopPropagation();

    uploadFile($upload.files);
  }, false);

  /**
   * upload file
   */
  function uploadFile(fileList) {
    var files = [];
    var formData = new FormData();

    if (fileList.length > 0) {
      var file;
      for (var key in fileList) {
        file = fileList[key];

        if (/^image\//.test(file.type)) {
          files.push(file);
        }
      }
      if (files.length > 0) {
        files.forEach(function(file) {
          formData.append('upload[]', file, file.name);
        });

        $tip.style.visibility = 'visible';
        send('/', 'POST', formData, function(ret) {
          var parseStr = '';
          $tip.style.visibility = 'hidden';


          if (ret.rtn === 0) {
            parseStr = ret.data.map(function(img) {
              return parseTemplate(img);
            }).join('');

            if (parseStr !== '') {
              console.log($preview.innerHTML);
              console.log(parseStr);
              $preview.innerHTML = parseStr + $preview.innerHTML;

              clipboard && clipboard.destroy();
              clipboard = new Clipboard('.copy');
              clipboard.on('success', function(e) {
                console.log(e);
                var $copyTip = e.trigger.nextElementSibling;
                console.log($copyTip);
                $copyTip.style.display = 'inline';
                setTimeout(function() {
                  $copyTip.style.display = 'none';
                }, 2000);
              });
            }
          }
        });
      }
    }
  }

  /**
   * ajax send
   */
  function send(uri, type, formData, cb) {
    var xhr = new XMLHttpRequest();

    xhr.open(type, uri, true);
    xhr.onload = function() {
      if (xhr.status === 200) {

        cb && cb(JSON.parse(xhr.responseText));
      }
    }

    xhr.send(formData);
  }

  /**
   * parse template
   */
  function parseTemplate(img) {
    var id = 'img' + Math.floor(Math.random() * 10000);
    return '<div class="img"><img src="' + img + '" /><div class="desc"><input id="' + id + '" type="text" value="' + img + '" /><button class="btn copy" data-clipboard-target="#' + id + '">Copy</button><span>copied</span></div></div>';
  }

}, false);
