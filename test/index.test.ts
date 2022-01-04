import * as fs from "fs/promises";
import { JSDOM } from "jsdom";

import { convertDir } from "../src/lib"

beforeEach(async () => {
    await fs.rm("test/output", { recursive: true, force: true });
});

afterAll(async () => {
    // await fs.rm("test/output", { recursive: true, force: true });
});

test("convert", async () => {
    var __out = "", __err = "";
    const log = {
        stdout: { write: function(str: string) { __out += str; return true; }},
        stderr: { write: function(str: string) { __err += str; return true; }},
    };

    const input = await fs.readFile("test/example/jacocoHtml/index.html");
    const orig = (new JSDOM(input)).window.document.querySelector("link[rel='shortcut icon']");
    expect(orig?.getAttribute("href")).toBe("jacoco-resources/report.gif");

    await convertDir(
        "test/example/jacocoHtml",
        "test/example/jacocoHtml/jacoco-resources",
        "test/output",
        log
    );
    expect(__out).toBe([
        "INPUT DIR:	test/example/jacocoHtml",
        "ASSET DIR:	test/example/jacocoHtml/jacoco-resources",
        "OUTPUT DIR:	test/output",
        "FILES FOUND:	6",
        "SEMAPHORE:	128\n",
    ].join("\n"))
    expect(__err.length).toBe(6);

    const output = await fs.readFile("test/output/index.html");
    const dest = (new JSDOM(output)).window.document.querySelector("link[rel='shortcut icon']");
    expect(dest?.getAttribute("href")?.startsWith("data:image/gif;base64")).toBeTruthy();
});
