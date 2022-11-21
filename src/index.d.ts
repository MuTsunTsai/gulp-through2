import stream = require('stream');
import File = require('vinyl');

declare namespace gulpThrough2 {

	/**
	 * Options for gulp-through2. All options are optional.
	 */
	export interface GulpThrough2Options {

		/**
		 * The content transformation function.
		 * Default value is `undefined`, implying no transformations are performed.
		 *
		 * @param {string} content The string content of the file.
		 * @param {File} file The {@link File} object.
		 * @param {BufferEncoding} encoding The encoding of the file.
		 * @returns {Awaitable<TransformResult>} The {@link TransformResult}, or a {@link Promise} of it.
		 */
		transform: (
			this: stream.Transform,
			content: string, file: File, encoding: BufferEncoding
		) => Awaitable<TransformResult>;

		/**
		 * Determining what files to transform.
		 * Untransformed files are passed through directly.
		 * See {@link Filter} for details.
		 *
		 * Default value is `undefined`, implying all files will be transformed.
		 */
		filter: Filter | Filter[];

		/**
		 * One may use this option to transform the file list passed through the plugin,
		 * so that the resulting list contains different files.
		 *
		 * Default value is `undefined`, implying the file list is not modified.
		 *
		 * @param {File[]} files The file list (after transformation, if applicable).
		 * @returns {Awaitable<File[] | void>} The new file list, or a {@link Promise} of it.
		 * If there's no returning value, the original file array moves on.
		 */
		flush: (this: stream.Transform, files: File[]) => Awaitable<File[] | void>;

		/**
		 * Whether to run {@link flush flush()} when the file list is empty.
		 *
		 * Default value is `false`.
		 */
		flushEmptyList: boolean;

		/**
		 * Transformation to used for stream contents.
		 * When the content of a file is a stream,
		 * it goes through this function instead of {@link transform transform()}.
		 *
		 * Default value is `undefined`, implying steaming is not supported.
		 * In this case an error will be thrown if a stream content is passed in.
		 *
		 * To disable this error, simply assign the identity function `stream => stream`.
		 *
		 * @param {NodeJS.ReadableStream} stream The stream content of a file.
		 * @returns {Awaitable<NodeJS.ReadableStream>} The transformed stream, or a {@link Promise} of it.
		 */
		streamTransform: (this: stream.Transform, stream: NodeJS.ReadableStream) => Awaitable<NodeJS.ReadableStream>;

		/**
		 * The name of the gulp plugin. Used only for printing errors.
		 * You won't need this unless you're creating a plugin for publishing.
		 *
		 * Default value is `"gulp-through2"`.
		 */
		name: string;

		/**
		 * Advanced options for creating {@link stream.Transform}.
		 *
		 * Default value is
		 * ```
		 * {
		 *     objectMode: true,
		 *     highWaterMark: 16,
		 * }
		 * ```
		 */
		transformOptions: stream.TransformOptions;
	}

	// There is a proposal for adding this type to TypeScript, but it's still open:
	// https://github.com/microsoft/TypeScript/issues/31394
	type Awaitable<T> = T | PromiseLike<T>;

	type StringLike = string | String;

	/**
	 * Values can be:
	 * 1. string: files with identical extension will be transformed.
	 * 2. {@link RegExp}: files with filenames matching the expression will be transformed.
	 * 3. a function that accepts {@link File} as a parameter:
	 *    it should returns boolean value indicating whether to transform the file.
	 *
	 * Or you can use an array of the above.
	 * In that case a file will be transformed if any of the conditions is met.
	 */
	type Filter = string | RegExp | ((file: File) => boolean);

	/**
	 * Transformed result can be one of the following:
	 *
	 * 1. string: file content will be replaced by this string
	 *    (with the same encoding as the original file).
	 * 2. {@link File} object: file will be replaced by this new file.
	 * 3. `null`: file will be discarded.
	 * 4. `void`: the original file object moves on.
	 */
	type TransformResult = StringLike | File | null | void;

	/**
	 * Utility function for reading the string content of a {@link File}.
	 *
	 * @param {File} file {@link File} object.
	 * @param {BufferEncoding | undefined} encoding Optional; default value is `"utf8"`.
	 * @returns {string} The string content of the file.
	 */
	export function read(file: File, encoding?: BufferEncoding): string;

	/**
	 * Utility function for writing string content to a {@link File}.
	 * @param {File} file {@link File} object.
	 * @param {StringLike} content string content to write.
	 * @param {BufferEncoding | undefined} encoding Optional; default value is `"utf8"`.
	 */
	export function write(file: File, content: StringLike, encoding?: BufferEncoding): void;
}

/**
 * Shorthand for quickly create a gulp plugin.
 * @param {gulpThrough2.GulpThrough2Options['transform']} transform See {@link gulpThrough2.GulpThrough2Options.transform GulpThrough2Options.transform} for details
 * @param {gulpThrough2.Filter | gulpThrough2.Filter[]} filter See {@link gulpThrough2.Filter Filter} for details.
 * @returns {stream.Transform} The created gulp plugin.
 */
declare function gulpThrough2(
	transform: gulpThrough2.GulpThrough2Options['transform'],
	filter?: gulpThrough2.Filter | gulpThrough2.Filter[]
): stream.Transform;

/**
 * Option syntax, allowing more control.
 * @param {Partial<gulpThrough2.GulpThrough2Options>} options See {@link gulpThrough2.GulpThrough2Options GulpThrough2Options} for details.
 * @returns {stream.Transform} The created gulp plugin.
 */
declare function gulpThrough2(
	options: Partial<gulpThrough2.GulpThrough2Options>
): stream.Transform;

export = gulpThrough2;
