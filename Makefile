GENERATED_FILES = \
	~/Development/keys/511847675586-dvu01fndl7cf8nvqhce6j9tuhbgt10rf.json \
	build/style.css \
	data \
	public/index.html \
	public/tables.html \
	public/_assets/build.js

all: .gitignore .gitattributes $(GENERATED_FILES)

article:
	@echo "\033[31mWARNING: Please use 'make download' instead of 'make article'\033[0m"
	bin/render-template -o public/index.html --download

clean:
	rm -f $(GENERATED_FILES)

.PHONY: public/index.html download

.gitignore:
	cp -n gitignore .gitignore 2>/dev/null || :
	rm -f gitignore

.gitattributes:
	cp -n gitattributes .gitattributes 2>/dev/null || :
	rm -f gitattributes

public/_assets/build.js: src/* src/**/* src/**/**/* require-config.js
	node_modules/.bin/r.js -o require-config.js out=$@ name=script

build/style.css: src/* src/**/* src/**/**/*
ifeq (,$(wildcard src/style.less))
	node_modules/.bin/r.js -o cssIn=src/style.css out=$@
else
	node_modules/less/bin/lessc src/style.less > $@
endif

data:
	mkdir -p data
	make download

.babelrc:
	@echo "{ \"presets\": [\"es2015\"] }" > .babelrc

src/script.js: src/es6/script.es6 .babelrc
		node_modules/.bin/babel $< -o $@

public/tables.html: bin/render-template config.yml src/* src/script.js
	mkdir -p data
	mkdir -p page-templates
	bin/render-template -o $@

public/index.html: bin/render-template config.yml src/* src/script.js
	mkdir -p data
	mkdir -p page-templates
	bin/render-template -o $@

scoop:
	@echo "\033[31mWARNING: Please use 'make download' instead of 'make scoop'\033[0m"
	bin/render-template -o public/index.html --download

download:
	bin/render-template -o public/index.html --download

# Google Spreadsheet credentials
~/Development/keys/511847675586-dvu01fndl7cf8nvqhce6j9tuhbgt10rf.json:
	node_modules/.bin/nytg-dataloader-setup

# S3 + imgix credentials
~/Development/keys/nyt-imgix.json:
	mkdir -p ~/Development/keys
	scp nytg@newsdev.ec2.nytimes.com:/mnt/var/git/apps/credentials/nyt-imgix.json  ~/Development/keys/nyt-imgix.json


# ASSETS

encode: install-assets.txt
	@node_modules/.bin/grunt encode

videos: install-assets.txt
	@type ffmpeg >/dev/null 2>&1 || { echo >&2 "\033[31mWARNING:\033[0m FFmpeg required. To install, run:\"ffmpeg --with-libvorbis --with-nonfree --with-gpl --with-libvpx --with-pthreads --with-libx264 --with-libfaac --with-theora --with-libogg\""; exit 1; }
	@node_modules/.bin/grunt videos

images: install-assets.txt ~/Development/keys/nyt-imgix.json
	@node_modules/.bin/grunt images

sprite: install-assets.txt
	@type gm >/dev/null 2>&1 || { echo >&2 "\033[31mWARNING:\033[0m GraphicsMagick required. To install, run:\"brew install GraphicsMagick\""; exit 1; }
	@node_modules/.bin/grunt makeSprite

install:
	@echo "\033[31mWARNING: Please use 'make install-assets' instead of 'make install'\033[0m"

install-assets:
	./bin/install-assets.sh
	echo "Success." > install-assets.txt

# Verifies that you installed assets locally
install-assets.txt:
	make install-assets
