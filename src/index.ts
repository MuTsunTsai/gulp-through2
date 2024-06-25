import PluginError = require('plugin-error');
import stream = require('stream');
import File = require('vinyl');

import type gt2 from './index.d';

type PartialOption = Pick<gt2.GulpThrough2Options, keyof typeof defaultOptions> & Partial<gt2.GulpThrough2Options>

const defaultOptions = {
	name: "gulp-through2",
	flushEmptyList: false,
};

// The default options here follows through2
const defaultStreamOptions: stream.DuplexOptions = {
	objectMode: true,
	highWaterMark: 16,
};

function isReadableStream(obj: unknown): obj is NodeJS.ReadableStream {
	// Duck typing
	return obj !== null &&
		typeof obj === "object" &&
		typeof obj['on'] === "function" &&
		typeof obj['pipe'] === "function" &&
		typeof obj['read'] === "function";
}

const gulpThrough2 = function(
	options: Partial<gt2.GulpThrough2Options> | gt2.GulpThrough2Options['transform'],
	filter?: gt2.Filter | gt2.Filter[]
): stream.Transform {

	// Shorthand syntax
	if(typeof options === "function") options = { transform: options, filter };

	const _options: PartialOption = Object.assign({}, defaultOptions, options);
	const files: File[] = [];
	const err = (e: unknown) => {
		let message = "Unknown error occur";
		if(typeof e === "string") message = e;
		else if(e instanceof Error) message = e.message;
		throw new PluginError(_options.name, message);
	}

	function match(file: File, filter: gt2.Filter | gt2.Filter[]): boolean {
		if(Array.isArray(filter)) return filter.some(f => match(file, f));

		// For string filter, check the file extension
		if(typeof filter === "string") return file.extname == filter;

		// For regular expression filter, check the entire filename
		if(filter instanceof RegExp) return filter.test(file.basename);

		// For function filter, pass the file to it
		if(typeof filter === "function") return Boolean(filter(file));

		// Return false for anything else
		return false;
	}

	async function transform(this: stream.Transform, chunk: unknown, encoding: BufferEncoding, callback: stream.TransformCallback) {
		function output(file: File): void {
			if(_options.flush) {
				files.push(file);
				callback();
			} else {
				callback(null, file);
			}
		}

		// In theory, `chunk` can be anything, so we perform a basic check first
		if(!File.isVinyl(chunk)) {
			return err("Given chunk is not a vinyl file; this transformation is for Gulp streams only.");
		}
		let file: File = chunk;

		// Check preconditions
		if(file.isNull()) return callback();
		if(!_options.streamTransform && file.isStream()) err("Streaming not supported.");
		if(_options.filter && !match(file, _options.filter)) return output(file);

		try {
			// Perform content transformation when applicable
			if(file.isBuffer() && _options.transform) {
				encoding ??= 'utf8';
				const content = gulpThrough2.read(file, encoding);
				const result = await _options.transform.call(this, content, file, encoding);

				// Check and process result
				if(result === null) {
					return callback();
				} else if(typeof result === "string" || result instanceof String) {
					gulpThrough2.write(file, result, encoding);
				} else if(File.isVinyl(result)) {
					file = result;
				} else if(typeof result !== "undefined") {
					throw "Transformed result isn't valid.";
				}
			}

			// Perform stream transformation when applicable
			else if(file.isStream() && _options.streamTransform) {
				const result = await _options.streamTransform.call(this, file.contents, file);
				if(result === null) return callback();
				if(!isReadableStream(result)) throw "Transformed result should be a readable stream.";
				file.contents = result;
			}
		} catch(e: unknown) {
			err(e);
		}

		output(file);
	}

	async function flush(this: stream.Transform, callback: stream.TransformCallback) {
		if(_options.flush && (_options.flushEmptyList || files.length)) {
			try {
				// Perform flush
				let outFiles: File[] | void = await _options.flush.call(this, files);
				if(outFiles === undefined) outFiles = files;

				// Pass on the new list of files
				for(const file of outFiles) this.push(file);

				// Clear the file list, in case the plugin is re-used
				files.length = 0;
			} catch(e: unknown) {
				err(e);
			}
		}
		callback();
	}

	// This is essentially what is done in through2.
	// Let's just get to it directly.
	const streamOptions: stream.TransformOptions = Object.assign({}, defaultStreamOptions, _options.transformOptions);
	const streamTransform = new stream.Transform(streamOptions);
	streamTransform._transform = transform;
	streamTransform._flush = flush;

	return streamTransform;
}

gulpThrough2.read = function(file: File, encoding?: BufferEncoding): string {
	return file.contents?.toString(encoding ?? "utf8") ?? "";
}

gulpThrough2.write = function(file: File, content: gt2.StringLike, encoding?: BufferEncoding): void {
	file.contents = Buffer.from(content, encoding);
}

export = gulpThrough2;
