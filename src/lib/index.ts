import { promises as fs } from 'fs';
import { extname, join, dirname } from 'path';
import { JSDOM } from 'jsdom';

class AssetEntry {
    public ext: string;
    public content: Buffer;
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
    private applyLink(tag: HTMLLinkElement, doc: Document) {
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
        tag.removeAttribute('src');
        tag.innerHTML = this.content.toString();
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

async function getAllFilesUnderDir(dirpath: string): Promise<string[]> {
    const entries = await fs.readdir(dirpath);
    const results: string[] = [];
    await Promise.all(entries.map(async entry => {
        const fullpath = join(dirpath, entry);
        const stat = await fs.stat(fullpath);
        if (stat.isDirectory()) {
            results.push(... await getAllFilesUnderDir(fullpath))
        } else if (extname(entry) == ".html") {
            results.push(fullpath);
        }
    }));
    return results;
}

export async function convertFile(fullpath: string, pool: AssetCachePool, outputdir: string) {
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
    // FIXME: Out of memory
    // Array.from<HTMLScriptElement>(window.document.querySelectorAll('script[type="text/javascript"]:not([src=""])')).map(scripttag => {
    //     const asset = join(dirname(fullpath), scripttag.src);
    //     const entry = pool.getEntry(asset);
    //     if (entry) entry.apply(scripttag);
    // });
    const destpath = join(outputdir, fullpath);
    await fs.mkdir(dirname(destpath), { recursive: true });
    await fs.writeFile(destpath, window.document.documentElement.outerHTML);
}

export async function convertDir(dirpath: string, resourcedir: string, outputdir: string = "output") {
    const pool = new AssetCachePool(resourcedir);
    await pool.load();
    await fs.mkdir(outputdir, { recursive: true })
    const all = await getAllFilesUnderDir(dirpath);
    all.map(async fullpath => await convertFile(fullpath, pool, outputdir));
}

export default convertDir;
