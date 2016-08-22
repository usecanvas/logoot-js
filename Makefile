BROWSERIFY = ./node_modules/.bin/browserify
UGLIFYJS = ./node_modules/.bin/uglifyjs
SOURCE = $(shell ls ./lib/**/*.js)

default: dist/logoot.min.js

dist/logoot.min.js: dist/logoot.js
	cat dist/logoot.js | $(UGLIFYJS) > dist/logoot.min.js

dist/logoot.js: $(SOURCE)
	$(BROWSERIFY) ./lib/logoot.js --standalone Logoot \
		--transform [ babelify --presets [ es2015 ] ] \
		--outfile dist/logoot.js
