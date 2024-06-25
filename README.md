
# gulp-through2

> A simple wrapper for creating gulp plugin instantly.


## Introduction

Let's face it: lots of gulp plugins are really just simple wrappers around
[through2](https://www.npmjs.com/package/through2)
(which in turns is just a simple wrapper around `stream.Transform`)
and some other NPM packages that do some simple content transformations.

Why the trouble? Why not just skip the middleman and create a plugin directly?
Introducing `gulp-through2`, a gulp meta-plugin that does exactly that,
using simple and flexible APIs. It works especially great when:

1. You want to perform a task in your gulp flow that doesn't have a corresponding gulp plugin yet,
   or the plugin is no longer actively maintained. (We all have been there, right?)
2. You want to create and perhaps publish a gulp plugin that is also a simple wrapper,
   and you don't want to repeat a lot of routine codes.

## Install

```
npm install --save-dev gulp-through2
```

## Quick examples

Here are a few quick example that gives you an idea how it works:

```js
const gulp = require('gulp');
const through2 = require('gulp-through2');

// This is like a simplified version of gulp-replace
const myReplace = (search, replacement) => through2(
	// In the shorthand syntax, string content of the file
	// is transformed with the given transformation function.
	content => content.replace(search, replacement)
);

// This is like a simplified version of gulp-concat
// This time we use the option syntax instead
const myConcat = filename => through2({
	// flush option takes an array of transformed files
	// (in this case there's no transformation function,
	// so its essentially the array of original files)
	flush(files) {
		// Easily read and write using gulp-through2 utility methods
		const join = files.map(f => through2.read(f)).join('\n');
		through2.write(files[0], join);

		// Create a new array containing a single file that passes on
		files[0].basename = filename;
		return [files[0]];
	}
});

// Now we can use them:
gulp.task('myTask', () =>
	gulp.src('src/*.js')
		.pipe(myReplace(/abc/g, "def"))
		.pipe(myConcat("joined.js"))
		.pipe(gulp.dest('...'))
);

```


## Basic options

Most gulp plugins follow a similar pattern:
first they check a certain preconditions
(especially the file extension and whether the file content is a stream),
and then replace the file content by a certain transformation.
Some plugins do a bit more than that:
they might add or remove files that pass through to the next gulp plugin.
This leads to the three most basic options of `gulp-through2`:

### `filter`

This option determines if a file should be transformed,
or should be passed through directly.
Its value can be a string, a regular expression, a function,
or an array of the above.
Each have different ways of filtering:

| Type       | Description                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------- |
| `String`   | The extension of the file should match exactly to the string (e.g. ".html"). Case-sensitive. |
| `RegExp`   | The full filename of the file is tested against the regular expression.                      |
| `Function` | The `File` object is passed to the function as the single parameter, and it should return boolean value indicating whether to transform the file. |
| `Array`    | The file will be transformed if any of the conditions in the array is met.                   |

If this options is not provided, all files will be transformed.

### `transform`

This is a function that takes three parameters:

| Parameter                  | Description                     |
| -------------------------- | ------------------------------- |
| `content: string`          | The string content of the file. |
| `file: File`               | The file object in question.    |
| `encoding: BufferEncoding` | The encoding of the file.       |

It should return one of the following (with different effects):

| Type     | Description                                            |
| -------- | ------------------------------------------------------ |
| `String` | The returned string will be used as the new content of the file.<br>Note: the original file object is kept, so other manipulations on it will be applied. |
| `File`   | The new file object will be passed on instead.         |
| `null`   | The file is discarded and will not be passed on.       |
| `void`   | The original file object (possibly mutated) passes on. |

If this option is not provided, no transformation will be applied to the files.

Note that `gulp-through2` provides a shorthand syntax that uses only the two said options:

```js
through2(transform, filter?)
```

### `flush`

This is a function that takes the transformed file array as parameter,
and it should return a new array indicating the files to be passed on.
You can then add, remove or change the order of the files as you like.

In case you still need to manipulate the file contents inside `flush()` function, `gulp-through2` provides two utility methods for reading and writing file contents:

```ts
function read(file: File, encoding?: BufferEncoding): string;
function write(file: File, content: string | String, encoding?: BufferEncoding): void;
```

Useful tip: you can use the `clone()` method of the `File` object to create a new file with the same base path as the rest of the files. Also check out the readme of [vinyl](https://github.com/gulpjs/vinyl) to learn more about how the use the `File` objects.


## Advanced options

For complete details of each options,
refer to [index.d.ts](src/index.d.ts).
Here is a brief account of each option:

| Option             | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `flushEmptyList`   | `boolean` value indicating whether to run `flush()` when the transformed file list is empty. Default value is `false`. |
| `streamTransform`  | A function for transforming stream contents of a file. If not provided, `gulp-through2` will throw an error when stream contents as passed in, which is the typical behavior in many gulp plugins. |
| `name`             | The name of your plugin. Used only for printing errors. |
| `transformOptions` |  Advanced options for creating `stream.Transform`.      |
