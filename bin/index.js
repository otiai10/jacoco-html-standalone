#!/usr/bin/env node
const fs = require('fs');
const yargs = require('yargs');
const jhs = require('../lib');

const argv = yargs
    .option('file', {
        alias: 'f',
        description: 'File to convert',
        type: 'string',
    })
    .option('resourceDir', {
        alias: 'r',
        description: 'Relative path to resource directory from the file',
        type: 'string',
        default: 'jacoco-resources',
    })
    .option('out', {
        alias: 'o',
        description: 'Output file name',
        type: 'string',
        default: 'output.html',
    })
    .help().alias('help', 'h').argv;

jhs.convert(argv.file, argv.resourceDir).then(content => {
    fs.writeFileSync(argv.out, content);
    console.log("Created:", argv.out);
});
