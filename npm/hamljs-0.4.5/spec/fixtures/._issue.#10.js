#!/usr/local/bin/node
// generated by npm, please don't touch!
var dep = require('path').join(__dirname, "./../../../.npm/hamljs/0.4.5/dependencies")
var depMet = require.paths.indexOf(dep) !== -1
var from = "./../../../.npm/hamljs/0.4.5/package/spec/fixtures/._issue.#10.html"

if (!depMet) require.paths.unshift(dep)
module.exports = require(from)

if (!depMet) {
  var i = require.paths.indexOf(dep)
  if (i !== -1) require.paths.splice(i, 1)
}
