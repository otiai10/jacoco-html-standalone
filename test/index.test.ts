import { convertDir } from "../src/lib"

test("convert", async () => {
    await convertDir(
        "test/example/jacocoHtml",
        "test/example/jacocoHtml/jacoco-resources",
        "test/output"
    )
})
