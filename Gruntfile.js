/* globals __dirname, process */
'use strict';

module.exports = function(grunt) {
  var _ = require('underscore');
  var fs = require('fs');
  var path = require('path');
  var yaml = require('js-yaml');
  var s3sync = require('s3-sync');
  var readdirp = require('readdirp');
  var request = require('request');
  var sizeOf = require('image-size');
  var ImgixClient = require('imgix-core-js');
  var config = yaml.load(fs.readFileSync(path.join(__dirname, 'config.yml'), 'utf-8'));
  var credentials = require(path.join(process.env.HOME, 'Development/keys/nyt-imgix.json'));

  var maxConcurrentImgixDownloads = 2;
  var projectSlug = 'NYTG_SLUG';

  require('time-grunt')(grunt);

  var tmpFolder = 'tmp/';

  // src assets
  var srcAssets = 'assets/',
      srcImages = srcAssets + 'images/',
      srcVideos = srcAssets + 'video/',
      srcCode = 'src/',
      srcSprite = 'assets/sprite/';

  // publish-ready assets
  var targetAssets = 'public/_assets/',
      targetBigAssets = 'public/_big_assets/',
      targetImages = targetBigAssets + 'images/',
      targetSprite = 'public/_assets/sprite/',
      targetData = 'data/',
      targetImageRatioData = targetData + 'imagedata.json';



  function download(uri, filename, cb){
    request.head(uri, function(err, res, body){
      request(uri)
        .on('error', function(err) {console.log(err); })
        .pipe(fs.createWriteStream(filename))
        .on('close', cb);
    });
  }


  // Define the configuration for all the tasks
  grunt.initConfig({

    // GENERATE VIDEOS IN THE CLOUD
    // 
    // This in a NYT-only grunt task without a lot of docs yet,
    // and pretty specific to this use case. If you need 
    // more advanced options talk to Josh Williams or 
    // Michael Strickland. Josh wrote the tiny grunt
    // wrapper around Michael's `videotape` app. 
    // 
    // Wrapper:
    // https://newsdev.ec2.nytimes.com/cgit/cgit.cgi/nytg/grunt-videotape.git/
    // 
    // All potential features:
    // https://github.com/newsdev/videotape
    videotape: {
      projectVideos: {
        options: {
          s3Path: config.videotape_path,
          sizes: config.video.sizes,
          quality: config.video.quality
        },
        files: [{
          expand: true,
          src: ['*.{mov,mp4}'],
          cwd: srcVideos
        }]
      }
    },

    bgShell: {
      makeStandardSprite: {
        cmd: function() {
          return 'gm convert public/_assets/sprite/sprite\@2x.png -resize 50% public/_assets/sprite/sprite.png';
        },
        stdout: false,
        stderr: true,
        bg: false,
        fail: true
      }
    },


    // IGNORE BELOW THIS LINE UNLESS
    // YOU KNOW WHAT YOU'RE DOING
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    },

    clean: {
      // working directory
      tmp: {
        expand: true,
        cwd: tmpFolder,
        src: ['**.*']
      },     

      // final destinations. not a
      // lot of reason to run these
      responsiveImagesTarget: {
        expand: true,
        cwd: targetImages,
        src: ['*.{jpg,gif,png}']
      }
    },

    copy: {

    },

    sprite:{
      retinaSprite: {
        src: srcSprite+'*.png',
        algorithm: 'binary-tree',
        dest: targetSprite+'sprite@2x.png',
        padding: 2,
        destCss: srcCode+'style-sprite.css',
        cssTemplate: function (params) {
          var template = _.template([
            '.g-icon.<%= name %> {',
            'background-image: url(_assets/sprite/sprite.png);',
            'background-position: <%= Math.round(offset_x/2) %>px <%= Math.round(offset_y/2) %>px;',
            'width: <%= Math.round(width/2) %>px;',
            'height: <%= Math.round(height/2) %>px;',
            'background-size: <%= Math.round(total_width/2) %>px <%= Math.round(total_height/2) %>px;',
            '}\n',
            '.g-retina .g-icon.<%= name %> {',
            'background-image: url(_assets/sprite/sprite@2x.png);',
            '}\n',
          ].join(''));

          var css = '/* sprite auto-generated by gruntfile.js. do not hand edit. */\n.g-icon{display: inline-block;}\n\n';
          _.each(params.items, function(item){
            css += template(item);
          });

          return css;
        },
        cssVarMap: function (sprite) {
          sprite.name = 'g-icon-' + sprite.name;
        },
      }
    }
  });

  grunt.registerTask('images', 'Generate image crops from source files in ' + srcImages, function(){
    var done = this.async();
    var images = [];

    readdirp({
      root: path.join(__dirname, srcImages),
      directoryFilter: ['!.git', '!cache', '!done'],
      fileFilter: ['*.jpg', '*.png']
    }).pipe(s3sync({
      key: credentials.s3.access_key,
      secret: credentials.s3.secret_access_key,
      bucket: credentials.s3.bucket,
      concurrency: 16,
      acl: 'private',
      prefix : projectSlug + '/'
    }).on('data', function(file) {
      
      var image = {
        path: file.fullPath,
        fileName: path.basename(file.fullPath),
        ext: path.extname(file.fullPath),
        slug: path.basename(file.fullPath, path.extname(file.fullPath)),
        url: file.url,
        newlyUploaded: file.fresh
      };

      var msg =  (image.newlyUploaded) ? 'Found new version of ' + image.fileName: 'Using existing version of ' + image.fileName;
      grunt.log.writeln(msg);

      images.push(image);
    }).on('end', function(){
      
      var imgix = new ImgixClient({
        host: credentials.imgix.url,
        secureURLToken: credentials.imgix.url_token
      });

      // from list of images uploaded to s3, generate the urls
      // for the various needed download rendtions.
      var imagesToDownload = [];
      images.forEach(function(image){        
        config.images.sizes.forEach(function(width){
          var retinaWidth = width * 2;

          // standard image
          imagesToDownload.push({
            url: imgix.buildURL(projectSlug+ '/' + image.slug + image.ext, {w: width, q: config.images.standard_quality }),
            localPath: path.join(__dirname, targetImages + image.slug + '-' + width + image.ext),
            slug: image.slug,
            size: width
          });

          // retina images
          if (config.images.retina_quality) {
            imagesToDownload.push({
              url: imgix.buildURL(projectSlug+ '/' + image.slug + image.ext, {w: retinaWidth, q: config.images.retina_quality }),
              localPath: path.join(__dirname, targetImages + image.slug + '-' + width + '_x2' + image.ext),
              slug: image.slug,
              size: width
            });
          }
        });
      });

      // download all the renditions and write image metadata to file
      require('async').eachLimit(imagesToDownload, maxConcurrentImgixDownloads, function(image, next){
        grunt.log.writeln('Generating ' +  image.slug + ' ' + image.size);
        download(image.url, image.localPath, next);
      }, function(){
        var imageData = images.map(function(image){
          var dimensions = sizeOf(image.path);
          return {
            slug: image.slug,
            ratio: dimensions.height / dimensions.width,
            sizes: config.images.sizes,
            extension: image.ext.replace('.', '')
          };
        });

        grunt.log.writeln('Writing', targetImageRatioData);
        grunt.file.write(targetImageRatioData, JSON.stringify(imageData, null, '\t'));
        done(); // fully done. call grunt task callback
      });
    }));
  });

  grunt.registerTask('encode', 'Encode videos in the cloud from source files in' + srcVideos, function(){
    // publish path has to be in this format: YYYY/MM/DD/slug, where slug is alphanumberic, underscores and hyphens
    if (!/^20[\d]{2}\/[\d]{2}\/[\d]{2}\/[\w-]+$/.test(config.videotape_path)) {
      throw grunt.util.error('Please set videotape_path in config.yml to something unique to your project, in this format: YYYY/MM/DD/slug');
    }
    grunt.task.run(['videotape:projectVideos']);
  });

  grunt.registerTask('makeSprite', 'Generate retina and stanard sprites', [
    'sprite:retinaSprite', // generate retina
    'bgShell:makeStandardSprite' // make standard
  ]);

  grunt.registerTask('all', 'All the files', [
    'images',
    'encode',
  ]);

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-bg-shell');
  grunt.loadNpmTasks('grunt-spritesmith');
  grunt.loadNpmTasks('grunt-videotape');

  // Default task.
  grunt.registerTask('default', ['all']);
};
