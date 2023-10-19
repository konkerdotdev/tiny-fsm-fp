import gulp from 'gulp';
import packageJson from './package.json' assert { type: 'json' };

gulp.task('copy-static', async () =>
  packageJson.staticFiles && packageJson.staticFiles.length > 0
    ? gulp
        .src(packageJson.staticFiles || '', {
          base: 'src',
        })
        .pipe(gulp.dest('dist'))
    : undefined
);
