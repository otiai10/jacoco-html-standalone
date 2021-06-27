# jacoco-html-asset-bundle

[![npm version](https://badge.fury.io/js/jacoco-html-asset-bundle.svg)](https://badge.fury.io/js/jacoco-html-asset-bundle)
[![npm download](https://img.shields.io/npm/dt/jacoco-html-asset-bundle.svg)](https://www.npmjs.com/package/jacoco-html-asset-bundle)
[![Node.js CI](https://github.com/otiai10/jacoco-html-asset-bundle/actions/workflows/node.js.yml/badge.svg)](https://github.com/otiai10/jacoco-html-asset-bundle/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/otiai10/jacoco-html-asset-bundle/branch/main/graph/badge.svg?token=SRS1T9LRXG)](https://codecov.io/gh/otiai10/jacoco-html-asset-bundle)
[![Maintainability](https://api.codeclimate.com/v1/badges/d7f117cb5ddc578a84e6/maintainability)](https://codeclimate.com/github/otiai10/jacoco-html-asset-bundle/maintainability)

Bundle and embed image files and CSS files into HTML files so that they will be displayed properly on some context, like [Azure DevOps Pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/).

# Why?

You would need this, for example, when you are working with Azure DevOps Pipelines and wanna upload your coverage files provided by [`jacoco-gradle-plugin`](https://docs.gradle.org/current/userguide/jacoco_plugin.html).

Even if your test coverage files are generated properly, HTML files would NOT be displayed properly on [Azure DevOps Pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/) page because of security concern controlled by their side: Loading external resources inside `iframe` seems not allowed.

- [No JaCoCo redbar.gif, greenbar.gif images in Coverage Reports on visualstudio.com - Developer Community](https://developercommunity.visualstudio.com/content/problem/312040/no-jacoco-redbargif-greenbargif-images-in-coverage.html)

# What does this package do?

`jacoco-html-asset-bundle` embeds all the images and CSS files to HTML files who requires those images and CSS.

For example, given

```html
<img src="../jacoco-resources/redbar.gif" width="8" height="10" title="6" alt="6"/>
```

then

```bash
jacoco-html-asset-bundle \
    -d jacocoHtml \
    -r jacocoHtml/jacoco-resources \
    -o output \
```

it will be like

```html
<img src="data:image/gif;base64,R0lGODlhAQAKAOMKAP8PD/8dHf8sLP9KSv9dXf99ff+MjP+goP+mpv+srACtAACtAACtAACtAACtAACtACH5BAEKAA8ALAAAAAABAAoAAAQIMIxyEjJEgAgAOw==" width="8" height="10" title="6" alt="6"/>
```

so that this HTML file can be displayed without external assets.

# Getting started

```bash
npm install -g jacoco-html-asset-bundle

jacoco-html-asset-bundle --help
```
