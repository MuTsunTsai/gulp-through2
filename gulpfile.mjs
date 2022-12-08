import gulp from 'gulp';
import ts from 'gulp-typescript';
import newer from 'gulp-newer';

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

export default gulp.parallel(build, copy);
