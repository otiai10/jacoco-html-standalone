#!/usr/bin/env node
import { option } from "yargs";
import convert from "../lib";

const argv = option('dir', {
    alias: 'd',
    description: 'Directory to convert',
    type: 'string',
}).option('resourceDir', {
    alias: 'r',
    description: 'Resource directory',
    type: 'string',
}).option('outDir', {
    alias: 'o',
    description: 'Output directory',
    type: 'string',
}).help().alias('help', 'h').argv;

(async () => {
    await convert(argv.dir, argv.resourceDir)
})();
