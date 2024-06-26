import gulp from 'gulp';
import ts from 'gulp-typescript';
import newer from 'gulp-newer';
import { pipeline } from 'stream';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

const project = ts.createProject("tsconfig.json");

const build = () =>
	project.src()
		.pipe(newer({
			dest: 'dist/index.js',
			extra: [__filename, 'tsconfig.json'],
		}))
		.pipe(project())
		.pipe(gulp.dest('dist'));

const copy = () =>
	gulp.src('src/index.d.ts')
		.pipe(newer('dist'))
		.pipe(gulp.dest('dist'));

export const test = async (cb) => {
	const through2 = (await import("./dist/index.js")).default;
	return pipeline(
		gulp.src("LICENSE"),
		through2(c => c.replace("(c)", "©")),
		gulp.dest("out"),
		cb
	);
};

export default gulp.parallel(build, copy);
