const gulp = require('gulp');
const rename = require('gulp-rename');
const { CleanRegistry, TsScripts } = require('@jswork/gulp-registry');

const task1 = new CleanRegistry();
const task2 = new TsScripts();

[task1, task2].forEach(gulp.registry);

gulp.task('typing', function () {
  return gulp
    .src('src/global.d.ts')
    .pipe(rename({ basename: 'index.d' }))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', gulp.series(['clean', 'ts:scripts:cjs', 'ts:scripts:esm', 'typing']));
