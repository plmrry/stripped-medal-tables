#!/bin/bash
mkdir -p assets/images/done
mkdir -p assets/video/done
mkdir -p assets/sprite
mkdir -p public/_big_assets/images
touch assets/images/done/.gitkeep
touch assets/video/done/.gitkeep
touch assets/sprite/.gitkeep
npm install grunt --save-dev
npm install grunt-cli --save-dev
npm install \
    grunt-contrib-copy@~0.4.1 \
    grunt-contrib-jshint@~0.7.0 \
    grunt-contrib-clean@~0.5.0 \
    grunt-usemin@~2.0.0 \
    grunt-newer@~0.6.0 \
    jshint-stylish@~0.1.3 \
    grunt-bg-shell@~2.3.1 \
    time-grunt@~1.2.1 \
    grunt-spritesmith@~6.0.0 \
    s3-sync@~1.0.0 \
    readdirp@~2.0.0 \
    image-size@~0.4.0 \
    request@~2.69.0 \
    async@~1.5.2 \
    imgix-core-js@1.0.3
npm install newsdev/videotape
npm install newsdev/grunt-videotape