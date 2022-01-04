import { convertDir } from "../src/lib"

test("convert", async () => {
    var __out = "", __err = "";
    const log = {
        stdout: { write: function(str: string) { __out += str; return true; }},
        stderr: { write: function(str: string) { __err += str; return true; }},
    };
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
})
