'use strict'

const del = require('del')
const fs = require('fs')
const gulp = require('gulp')
const babel = require('gulp-babel')
const rename = require('gulp-rename')
const postCss = require('gulp-postcss')
const postCssCalc = require('postcss-calc')
const postCssVariables = require('postcss-css-variables')
const postCssImport = require('postcss-import')
const util = require('util')

async function injectCSS(done) {
  const readFile = util.promisify(fs.readFile)
  const writeFile = util.promisify(fs.writeFile)

  const [css, es6] = await Promise.all([
    readFile('./dist/szn-options.css', 'utf-8'),
    readFile('./dist/szn-options.es6.js', 'utf-8'),
  ])

  await writeFile('./dist/szn-options.es6.js', replaceCss(es6, css), 'utf-8')

  done()

  function replaceCss(sourceJS, cssToInject) {
    return sourceJS.replace('%{CSS_STYLES}%', cssToInject)
  }
}

function compileJs() {
  return gulp
    .src('./dist/szn-options.es6.js')
    .pipe(babel({
      presets: [['env', {
        targets: {
          browsers: ['ie 8'],
        },
      }]],
    }))
    .pipe(rename('szn-options.es3.js'))
    .pipe(gulp.dest('./dist'))
}

const copy = gulp.parallel(
  copyES6Implementation,
  copyPackageMetaFiles,
)

function copyPackageMetaFiles() {
  return gulp
    .src(['./LICENSE', './package.json', './README.md'])
    .pipe(gulp.dest('./dist'))
}

function copyES6Implementation() {
  return gulp
    .src('./szn-options.js')
    .pipe(rename('szn-options.es6.js'))
    .pipe(gulp.dest('./dist'))
}

function compileCss() {
  return gulp
    .src('./szn-options.css')
    .pipe(postCss([
      postCssImport(),
      postCssVariables({
        preserve: true,
      }),
      postCssCalc(),
    ]))
    .pipe(gulp.dest('./dist'))
}

function minify() {
  return gulp
    .src('./dist/*.js')
    .pipe(babel({
      presets: ['minify'],
    }))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('./dist'))
}

function clean() {
  return del('./dist')
}

function cleanup() {
  return del('./dist/szn-options.css')
}

exports.default = gulp.series(
  clean,
  gulp.parallel(
    copy,
    compileCss,
  ),
  injectCSS,
  compileJs,
  minify,
  cleanup,
)
