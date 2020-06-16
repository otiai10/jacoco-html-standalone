const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');

module.exports = (() => {
    const __module = {};
    class ResourceCache {
        constructor(root, dir) {
            this.root = root;
            this.dir = dir;
            this.cache = {};
        }
        load() {
            // FIXME: assuming all the resources are placed on the top level
            const resources = fs.readdirSync(path.join(this.root, this.dir));
            return Promise.all(resources.map(resource => this.loadResource(resource)))
        }
        loadResource(filepath) {
            const entry = this.getEntry(path.join(this.root, this.dir, filepath));
            const refpath = path.join(this.dir, filepath);
            if (typeof this.cache[refpath] == "undefined") {
                this.cache[refpath] = entry;
            }
            return Promise.resolve(true);
        }
        getEntry(fullpath) {
            const content = fs.readFileSync(fullpath);
            const ext = path.extname(fullpath);
            switch (ext) {
                case '.gif':
                    const base64 = 'data:image/gif;base64,' + content.toString('base64');
                    return { ext, update(tag) { tag.src = base64; } };
                case '.css':
                    return { ext, update(tag, document) {
                        const style = document.createElement('style');
                        style.innerHTML = content.toString();
                        tag.parentNode.insertBefore(style ,tag);
                    }};
                // TODO:
                // case '.js':
                default:
                    return { ext, update(tag) { } };
            }
        }
    }
    function convert(filepath, resourceDirRelativePath = 'jacoco-resources') {
        const content = fs.readFileSync(filepath);
        const resources = new ResourceCache(path.dirname(filepath), resourceDirRelativePath);
        return resources.load().then(() => {
            const { window } = new jsdom.JSDOM(content);
            Array.from(window.document.querySelectorAll('img')).map(imgtag => {
                const entry = resources.cache[imgtag.src];
                if (entry) entry.update(imgtag);
            });
            Array.from(window.document.querySelectorAll('link[rel=stylesheet][type="text/css"]')).map(linktag => {
                const entry = resources.cache[linktag.href];
                if (entry) entry.update(linktag, window.document);
            });
            return Promise.resolve(window.document.documentElement.outerHTML);
        });
    };
    __module.convert = convert;
    return __module;
})();