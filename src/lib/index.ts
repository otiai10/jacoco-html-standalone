import { promises as fs } from 'fs';
import { extname, join, dirname } from 'path';
import { JSDOM } from 'jsdom';
import { Semaphore } from 'await-semaphore';

interface Log {
    stdout: { write(str: Uint8Array | string, encoding?: BufferEncoding, cb?: (err?: Error) => void): boolean; }
    stderr: { write(str: Uint8Array | string, encoding?: BufferEncoding, cb?: (err?: Error) => void): boolean; }
}

const Quiet: Log = {
    stdout: { write(str: Uint8Array | string) { return true; } },
    stderr: { write(str: Uint8Array | string) { return true; } },
}

class AssetEntry {
    public ext: string;
    private content?: Buffer;
    constructor(public path: string) {
        this.ext = extname(path);
    }
    public async load(): Promise<AssetEntry> {
        this.content = await fs.readFile(this.path);
        return this;
    }
    public apply(tag: HTMLImageElement | HTMLLinkElement | HTMLScriptElement, doc?: Document) {
        switch (tag.tagName) {
            case "IMG": return this.applyImage(tag as HTMLImageElement);
            case "LINK": return this.applyLink(tag as HTMLLinkElement, doc);
            case "SCRIPT": return this.applyScript(tag as HTMLScriptElement);
        }
    }
    private applyImage(tag: HTMLImageElement) {
        if (!this.content) {
            throw Error("failed to apply content to IMAGE tag: content is null, call `load` first")
        }
        switch (this.ext) {
            case '.gif':
                tag.src = `data:image/gif;base64,${this.content.toString('base64')}`;
                return;
            case '.jpg':
            case '.jpeg':
                tag.src = `data:image/jpeg;base64,${this.content.toString('base64')}`;
                return;
        }
    }
    private applyLink(tag: HTMLLinkElement, doc?: Document) {
        if (!this.content) {
            throw Error("failed to apply content to LINK tag: content is null, call `load` first")
        }
        if (!doc) {
            throw Error("failed to apply contents to LINK tag: document is null");
        }
        if (!tag.parentNode) {
            throw Error("failed to apply contents to LINK tag: parent of link is null");
        }
        switch (this.ext) {
            case '.css':
                const style = doc.createElement('style');
                style.innerHTML = this.content.toString();
                tag.parentNode.insertBefore(style, tag);
                tag.remove();
                return;
            case '.gif':
                tag.href = `data:image/gif;base64,${this.content.toString('base64')}`;
                return;
        }
    }
    private applyScript(tag: HTMLScriptElement) {
        if (!this.content) {
            throw Error("failed to apply content to SCRIPT tag: content is null, call `load` first")
        }
        const start = /<script>/gi;
        const end = /<\/script>/gi;
        tag.removeAttribute('src');
        // Clean the contents of JavaScript so it doesn't break following markup.
        // See https://github.com/otiai10/jacoco-html-asset-bundle/pull/6
        tag.innerHTML = this.content.toString().replace(start,'').replace(end,'');
        // FIXME: This code simply get rid of <script> and </script>,
        //        regardless of whether it's in comment or not.
        return tag;
    }
}

class AssetCachePool {
    private entries: { [fullpath: string]: AssetEntry } = {};
    constructor(private dir: string) {}
    public async load() {
        const files = await fs.readdir(this.dir);
        await Promise.all(files.map(file => this.loadFile(file)));
        return this;
    }
    private async loadFile(file: string) {
        const fullpath = join(this.dir, file);
        if (!this.entries[fullpath]) {
            this.entries[fullpath] = await this.createEntry(fullpath);
        }
    }
    private async createEntry(fullpath: string): Promise<AssetEntry> {
        return await (new AssetEntry(fullpath)).load();
    }
    public getEntry(fullpath: string): AssetEntry | void {
        return this.entries[fullpath];
    }
}

class PathManager {
    constructor(
        public srcDir: string,
        public outDir: string,
    ) {}
    public getDest(fullpath: string) {
        // FIXME: in case srcDir has prefix "./", it doesn't match fullpath
        return fullpath.replace(this.srcDir, this.outDir);
    }
}

async function getAllFilesUnderDir(parentdir: string): Promise<string[]> {
    const entries = await fs.readdir(parentdir);
    const results: string[] = [];
    await Promise.all(entries.map(async entry => {
        const fullpath = join(parentdir, entry);
        const stat = await fs.stat(fullpath);
        if (stat.isDirectory()) {
            results.push(... await getAllFilesUnderDir(fullpath))
        } else if (extname(entry) == ".html") {
            results.push(fullpath);
        }
    }));
    return results;
}

export async function convertFile(fullpath: string, pool: AssetCachePool, pm: PathManager, log: Log = {
    stdout: process.stdout,
    stderr: process.stderr,
}) {
    const content = await fs.readFile(fullpath);
    const { window } = new JSDOM(content);
    Array.from(window.document.querySelectorAll("img")).map(imgtag => {
        const asset = join(dirname(fullpath), imgtag.src);
        const entry = pool.getEntry(asset);
        if (entry) entry.apply(imgtag, window.document);
    });
    Array.from<HTMLLinkElement>(window.document.querySelectorAll('link')).map(linktag => {
        const asset = join(dirname(fullpath), linktag.href);
        const entry = pool.getEntry(asset);
        if (entry) entry.apply(linktag, window.document);
    });
    Array.from<HTMLScriptElement>(window.document.querySelectorAll('script[type="text/javascript"]:not([src=""])')).map(scripttag => {
        const asset = join(dirname(fullpath), scripttag.src);
        const entry = pool.getEntry(asset);
        if (entry) entry.apply(scripttag);
    });
    const destpath = pm.getDest(fullpath);
    await fs.mkdir(dirname(destpath), { recursive: true });
    await fs.writeFile(destpath, window.document.documentElement.outerHTML);
    log.stderr.write('.');
}

export async function convertDir(
    dirpath: string,
    resourcedir: string,
    outputdir: string = "output",
    log: Log = {
        stdout: process.stdout,
        stderr: process.stderr,
    }
) {
    const pool = new AssetCachePool(resourcedir);
    await pool.load();
    await fs.mkdir(outputdir, { recursive: true })

    const pm = new PathManager(dirpath, outputdir);

    log.stdout.write(`INPUT DIR:\t${dirpath}\n`);
    log.stdout.write(`ASSET DIR:\t${resourcedir}\n`);
    log.stdout.write(`OUTPUT DIR:\t${outputdir}\n`);

    const all = await getAllFilesUnderDir(dirpath);
    log.stdout.write(`FILES FOUND:\t${all.length}\n`);

    const semsize = 128;
    const sem = new Semaphore(semsize);
    log.stdout.write(`SEMAPHORE:\t${semsize}\n`);

    return Promise.all(all.map(fullpath => sem.use(() => convertFile(fullpath, pool, pm, log))));
}

export default convertDir;
