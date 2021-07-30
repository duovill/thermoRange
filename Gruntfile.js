/*
Fort new spawn, ports:
    livereload
           (grunt.cli.tasks.includes('cluster:dev-slave') ? 35730 : 35729)
           client/app/ngivr.js

grunt express cluster port
            debug: 5858,
 */
const utils = require('corifeus-utils');
const fs = require('fs');
//const fsExtra = require('fs-extra');
const settings = require("./settings.js");
const os = require('os');
const mz = require('mz');
//var endOfLine = require('os').EOL;

const isWindows = os.platform() === 'win32';

console.log('Windows: %s', isWindows);

const banner = `/**
NGIVR v${settings.version} ${settings.dateString}
**/`;

const silentServer = process.argv.includes('--silent') ? 'NGIVR_SILENT' : 'NGIVR_SILENT_DISABLED';

const injectorScripts = settings.injector.concat([
    'client/{components,app}/**/*.js',
    '!client/{app,components,shared}/**/*.spec.js',
    '!client/{app,components,shared}/**/*.mock.js'
]);

const injectorCss = [
    'client/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'client/assets/metronic/assets/admin/global/css/components-md.css',
    'client/assets/metronic/assets/admin/layout2/css/layout.css',
    'client/assets/metronic/assets/admin/layout2/css/themes/light.css',
    'client/bower_components/materialize/bin/materialize.css',
    'client/assets/style-dynamic.css',
    'client/{app,components}/**/*.css'
];

const wiredepExclude = [
    'materialize/bin/materialize.css',
    'materialize/bin/materialize.js',
];

const wiredepOverrides = {
    // for jgrowl it requires animate, so slim is not good
    'jquery': {
        main: 'dist/jquery.js'
    },
    moment: {
        main: [
            'moment.js',
            'locale/hu.js',
            'locale/en.js'
        ]
    },
    codemirror: {
        main: [
            'lib/codemirror.css',
            'lib/codemirror.js',
            'addon/selection/active-line.js',
            'addon/mode/simple.js',
            'addon/mode/multiplex.js',
            'mode/xml/xml.js',
            'mode/javascript/javascript.js',
            'mode/css/css.js',
            'mode/htmlmixed/htmlmixed.js',
            'mode/handlebars/handlebars.js',
        ]
    },
    'angular-i18n': {
        main: [
            'angular-locale_hu-hu.js',
        ]
    },
    'tinymce-i18n': {
        main: 'langs/hu_HU.js'
    },
    /*
    'jquery-ui': {
      main: [
        'jquery-ui.js',
        'themes/base/jquery-ui.css',
        'ui/i18n/datepicker-hu.js'
      ]
    }
    */
    'threejs': {
        main: [
            'build/three.min.js',
            'examples/js/controls/OrbitControls.js',
            'examples/js/geometries/ConvexGeometry.js',
            'examples/js/math/ConvexHull.js'
        ]
    }
};

const wiredepConfig = {
    target: {
        src: 'client/index.html',
        ignorePath: 'client/',
        overrides: wiredepOverrides,
        exclude: wiredepExclude
    }
};

const wiredepResult = require('wiredep')(wiredepConfig.target);

let localConfig;
try {
    localConfig = require('./server/config/local.env');
} catch (e) {
    localConfig = {};
}

const ngtemplatesConfig = {
    options: {
        // This should be the name of your apps angular module
        module: 'ngIvrApp',
        htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            keepClosingSlash: true, // Only if you are using SVG in HTML
            removeAttributeQuotes: true,
            removeComments: true, // Only if you don't use comment directives!
            removeEmptyAttributes: true,
            // itt valami büzlik , true-val kene mukodjon
            // https://www.npmjs.com/package/html-minifier
            // removeRedundantAttributes
            // http://perfectionkills.com/experimenting-with-html-minifier/#remove_redundant_attributes
            removeRedundantAttributes: false,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
        },
    },
    main: {
        cwd: 'client',
        src: ['{app,components}/**/*.html'],
        dest: '.tmp/templates.js'
    }
};

const motd = fs.readFileSync('motd.txt', "utf8");

module.exports = function (grunt) {

    //
    if (grunt.cli.tasks.length === 0) {
        process.env.NGIVR_NO_CLUSTER = 1;
    }

    const liverloadPort = grunt.cli.tasks.includes('cluster:no-liverload') ?
        false
        :
        (grunt.cli.tasks.includes('cluster:dev-slave') ? 36730 : 36731)

    const livereloadSettings = {
        port: liverloadPort,
        host: 'localhost',
//        key: grunt.file.read(`${__dirname}/server/config/localhost-privkey.pem`),
//        cert: grunt.file.read(`${__dirname}/server/config/localhost-cert.pem`)
        // you can pass in any other options you'd like to the https server, as listed here: http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
    }

    grunt.log.ok(motd);

    const builder = require('ngivr-builder')
    builder.grunt.wire({
        grunt: grunt,
        jenkinsGruntPreCommand: `service ngivr-development stop
#redis-cli -n 15 flushdb
rm -rf .tmp
rm -rf dist-prev
[ -d dist ] && mv dist dist-prev
bower install --allow-root`,
        jenkinsGruntCommand: `
#redis-cli -n 15 flushdb
service ngivr-development start`,
        jit: {
            express: 'grunt-p3x-express',
            sass: 'grunt-sass',
            wiredep: 'grunt-wiredep',
            clean: 'grunt-contrib-clean',
            cssmin: 'grunt-contrib-cssmin',
            concat: 'grunt-contrib-concat',
            copy: 'grunt-contrib-copy',
            ngtemplates: 'grunt-angular-templates',
            //babel: 'grunt-babel',
        },
        config: {

            // Project settings
            pkg: grunt.file.readJSON('package.json'),
            babel: {
                dist: {
                    files: {
                        '.tmp/ngivr.js': '.tmp/ngivr.js'
                    }
                }
            },
            express: {
                options: {
                    port: process.env.PORT || 9000
                },
                test: {
                    options: {
                        script: 'server/app.js',
                        debug: 5859,
                        port: 9001,
                        env: {
                            'TZ': "Europe/Budapest",
                        },
                    }
                },
                dev: {
                    options: {
                        script: 'server/app.js',
                        debug: 5858,
                        env: {
                            'TZ': "Europe/Budapest",
                            'NGIVR_LOCAL': 1,
                        },
                    }
                },

                cluster: {
                    options: {
                        env: {
                            //   'NGIVR_NO_CLUSTER': 1,
                            'NGIVR_CLUSTER': 1,
                            'NGIVR_LOCAL': 1,
                            'TZ': "Europe/Budapest",
                            //'NGIVR_ERROR_EMAIL': 1,
                            [silentServer]: silentServer,
                            'NGIVR_WORKERS': process.env.NGIVR_WORKERS || 1
                        },
                        script: 'server/app.js',
                        debug: 8858,
                    }
                },
                'cluster-prod': {
                    options: {
                        env: {
                            //   'NGIVR_NO_CLUSTER': 1,
                            'NGIVR_CLUSTER': 1,
                            'NGIVR_LOCAL': 1,
                            'TZ': "Europe/Budapest",
                          //  'NGIVR_ERROR_EMAIL': 1,
                            [silentServer]: silentServer,
                            'NGIVR_WORKERS': process.env.NGIVR_WORKERS || 1,
                            NODE_ENV: 'production'
                        },
                        script: 'server/app.js',
                        debug: 5858,
                    }

                },
                'dev-slave': {
                    options: {
                        node_env: 'dev-slave',
                        script: 'server/app.js',
                        debug: 5860,
                        port: 9002,
                        env: {
                            'TZ': "Europe/Budapest",
                            'NGIVR_LOCAL': 1,
                        },
                    }
                },
                prod: {
                    options: {
                        script: 'dist/server/app.js',
                        env: {
                            'TZ': "Europe/Budapest",
                        },
                    }
                }
            },
            sass: {
                options: {
                    implementation: require('node-sass'),
                    sourceMap: false,
                    outputStyle: 'expanded'
                },
                target: {
                    files: {
                        'client/assets/style-dynamic.css': 'client/assets/style-dynamic.scss',
                        'client/assets/ngivr-html-template/ngivr-html-template.css': 'client/assets/ngivr-html-template/ngivr-html-template.scss'
                    }
                }
            },

            watch: {

                sass: {
                    files: [
                        'client/**/*.scss',
                    ],
                    tasks: ['injector:sass', 'sass'],

                },
                injectJS: {
                    files: [
                        'client/{app,components}/**/*.js',
                        '!client/{app,components}/**/*.spec.js',
                        '!client/{app,components}/**/*.mock.js',
                        '!client/app/app.js'],
                    tasks: ['injector:scripts']
                },
                injectCss: {
                    files: [
                        'client/{app,components}/**/*.css'
                    ],
                    tasks: ['injector:css']
                },
                mochaTest: {
                    options: {
                        atBegin: grunt.option('src') === undefined ? false : true,
                    },
                    files: [
                        'server/**/*.spec.js',
                        'test/server/**/*.js',
                    ],
                    tasks: ['env:test', 'mochaTest:src']
                },
                gruntfile: {
                    files: ['Gruntfile.js']
                },
                livereload: {
                    files: [
                        '{.tmp,client}/{app,components,assets}/**/*.css',
                        '{.tmp,client}/{app,components}/**/*.html',
                        '{.tmp,client}/{app,components}/**/*.js',
                        '{.tmp,client}/assets/images/{,*//*}*.{png,jpg,jpeg,gif,webp,svg}',
                        '{.tmp,client}/assets/icons/{,*//*}*.{png,jpg,jpeg,gif,webp,svg}',
                        '{.tmp,client}/assets/iconsets/{,*//*}*.{png,jpg,jpeg,gif,webp,svg}',

                        '!{.tmp,client}{app,components}/**/*.spec.js',
                        '!{.tmp,client}/{app,components}/**/*.mock.js',
                    ],
                    options: {
                        livereload: livereloadSettings,
                        reload: true,
                    }
                },

                express: {
                    files: [
                        'Gruntfile.js',
                        'node_modules/p3x-html-pdf/**/*.*',
                        'client/shared/**/*.{js,json}',
                        'server/**/*.{js,json}'
                    ],
                    tasks: ['express:cluster', 'wait'],
                    options: {
                        livereload: false,
                        spawn: false,
                        nospawn: true,
                    }
                },
            },

            // Automatically inject Bower components into the app
            wiredep: wiredepConfig,

            concat: {
                options: {
                    separator: ';\n'
                },
                bower: {
                    src: wiredepResult.js,
                    dest: '.tmp/bower.js'
                },
                ngivr: {
                    src: injectorScripts,
                    dest: '.tmp/ngivr.js'
                },
                js: {
                    src: [
                        // babel
                        //'.tmp/polyfill.min.js',
                        '.tmp/bower.js',
                        '.tmp/ngivr.js',
                        '.tmp/templates.js',
                    ],
                    dest: '.tmp/all.js'
                },
                css: {
                    src: [
                        '.tmp/bower.css',
                        '.tmp/ngivr.css'
                    ],
                    dest: '.tmp/all.css'
                }
            },

            cssmin: {
                options: {
                    mergeIntoShorthands: false,
                    roundingPrecision: -1,
                    report: 'gzip',
                    keepSpecialComments: 0
                },
                bower: {
                    files: [
                        {
                            expand: false,
                            src: wiredepResult.css,
                            dest: '.tmp/bower.css'
                        }
                    ]
                },
                ngivr: {
                    files: [{
                        expand: false,
                        src: injectorCss,
                        dest: '.tmp/ngivr.css'
                    }]
                },
            },

            // Empties folders to start fresh
            clean: {
                build: {
                    file: [
                        {
                            src: [
                                'build'
                            ]
                        }
                    ]
                },
                tmp: {
                    files: [{
                        dot: true,
                        src: [
                            'tmp',
                            '.tmp'
                        ]
                    }]
                },
                dist: {
                    files: [{
                        dot: true,
                        src: [
                            '.tmp',
                            'dist',
                            'dist/*',
                        ]
                    }]
                },
                server: '.tmp',

            },



            // Package all the html partials into a single javascript payload
            ngtemplates: ngtemplatesConfig,

            // Copies remaining files to places other tasks can use
            copy: {
                babel: {
                    files: [
                        {
                            flatten: true,
                            expand: true,
                            src: [
                                'node_modules/@babel/polyfill/dist/polyfill.min.js'
                            ],
                            dest: '\.tmp'
                        }
                    ]
                },
                dist: {
                    files: [
                        {
                            expand: true,
                            dot: true,
                            cwd: 'client',
                            dest: 'dist/client',
                            src: [
                                '*.{ico,png,txt}',
                                '.htaccess',
                                'bower_components/**/*',
                                'shared/**/*',
                                'assets/**/*',
                                'error/**/*',
                                'index.html',
                                '!**/*.scss',
                                '!**/*.less',
                            ]
                        }, {
                            expand: true,
                            dest: 'dist',
                            src: [
                                'LICENSE',
                                'package.json',
                                'settings.json',
                                'server/**/*'
                            ]
                        }]
                },
                fonts: {
                    files: [
                        {
                            expand: true,
                            flatten: true,
                            dot: true,
                            cwd: 'client',
                            dest: 'dist/client/fonts',
                            src: [
                                '**/fonts/**/*.*',
                                '!**/fonts/roboto/**/*.*',
                                '!**/tinymce/**/*.*'
                            ]
                        },
                        {
                            expand: true,
                            flatten: true,
                            dot: true,
                            cwd: 'client',
                            dest: 'dist/client/fonts/roboto/',
                            src: [
                                '**/fonts/roboto/**/*.*'
                            ]
                        }

                    ]
                },
                completed: {
                    files: [
                        {
                            expand: true,
                            flatten: true,
                            dot: true,
                            cwd: '.tmp/',
                            dest: 'dist/client/',
                            src: [
                                'all.js',
                                'all.css'
                            ]
                        }
                    ]
                }
            },

            // Test settings

            mochaTest: {
                options: {
                    reporter: 'spec',
                    timeout: 20000
                },
                src: grunt.option('src') || [
                    'server/**/*.spec.js',
                    'test/server/**/*.js',
                ]
            },

            env: {
                test: {
                    NODE_ENV: 'test'
                },
                prod: {
                    NODE_ENV: 'production'
                },
                all: localConfig
            },

            injector: {
                options: {},
                // Inject application script files into index.html (doesn't include bower)
                scripts: {
                    options: {
                        transform: function (filePath) {
                            filePath = filePath.replace('/client/', '');
                            return '<script src="' + filePath + '"></script>';
                        },
                        starttag: '<!-- injector:js -->',
                        endtag: '<!-- endinjector -->'
                    },
                    files: {
                        'client/index.html': injectorScripts
                    }
                },

                // Inject component css into index.html
                css: {
                    options: {
                        transform: function (filePath) {
                            filePath = filePath.replace('/client/', '');
                            return '<link rel="stylesheet" href="' + filePath + '">';
                        },
                        starttag: '<!-- injector:css -->',
                        endtag: '<!-- endinjector -->'
                    },
                    files: {
                        'client/index.html': injectorCss
                    }
                },
                sass: {
                    options: {
                        transform: function (filePath) {
                            filePath = filePath.replace('/client/', '');
                            return '@import "../' + filePath + '";';
                        },
                        starttag: '//injector-sass-start',
                        endtag: '//injector-sass-end',
                    },
                    files: {
                        'client/assets/style-dynamic.scss': [
                            'client/assets/sass/**/*.scss',
                            'client/components/**/*.scss',
                            'client/app/**/*.scss'
                        ]
                    }
                },
            },

        }
    })


    // Used for delaying livereload until after server has restarted
    grunt.registerTask('wait', function () {
        grunt.log.ok('Waiting for server reload...');

        const done = this.async();

        setTimeout(function () {
            grunt.log.ok('Done waiting!');
            done();
        }, 10000);
    });


    grunt.registerTask('ngivr-settings', function () {

        const done = this.async();

        const child = grunt.util.spawn({
            grunt: 'grunt',
            args: ['ngivr:version:release', 'ngivr:license', '--grunt-corifeus-time-disable'],
        }, () => {
        });

        child.stdout.on('data', (data) => {
            grunt.log.writeln(data.toString())
        });

        child.stdout.on('error', (data) => {
            grunt.log.error(data.toString())
        });

        child.stdout.on('end', async () => {
            try {
                const settings = require("./settings.js");
                const settingsJson = {};
                Object.keys(settings).forEach(setting => {
                    if (setting !== 'injector') {
                        settingsJson[setting] = settings[setting]
                    }
                })
                await mz.fs.writeFile('./settings.json', JSON.stringify(settingsJson, null, 4));
                done();
            } catch (e) {
                done(e);
            }
        });
    });

    grunt.registerTask('ngivr-ngtemplates-override', 'Use NgTemplates Fix for show Errors in Build', function () {

        const done = this.async();

        const child = grunt.util.spawn({
            grunt: true,
            args: ['ngtemplates', '--grunt-corifeus-time-disable'],
        }, () => {
        });

        let result = '';
        child.stdout.on('data', (data) => {
            result += data;
            grunt.log.writeln(data);
        });

        child.stdout.on('end', () => {
            result = result.toLowerCase();
            if (result.includes('error') && result.includes('abort')) {
                done(new Error('HTML hiba! [NgTemplates]'));
                return;
            }
            done();
        });

    });


    grunt.registerTask('cluster', function (target) {

        if (target === 'dev-slave') {
            return grunt.task.run([
                'ngivr-settings',
                'clean:server',
                'env:all',
                'common',
                'express:dev-slave',
                'wait',
                'watch'
            ]);
        }

        if (target === 'no-livereload') {
            return grunt.task.run([
                'ngivr-settings',
                'clean:server',
                'env:all',
                'common',
                'express:dev-slave',
                'wait',
                'watch'
            ]);
        }


        if (target === 'prod') {
            return grunt.task.run([
                'ngivr-settings',
                'clean:server',
                'env:all',
                'common',
                'express:cluster-prod',
                'wait',
                'watch'
            ]);
        }



        grunt.task.run([
            'ngivr-settings',
            'clean:server',
            'env:all',
            'common',
            'express:cluster',
            'wait',
            'watch'
        ]);

    });

    grunt.registerTask('test', function () {
        return grunt.task.run([
            'clean:tmp',
            'env:all',
            'env:test',
            'mochaTest:src'
        ]);
    });

    grunt.registerTask('common', ['injector', 'wiredep', 'sass']);
    grunt.registerTask('common-build', [
        'ngivr-settings',
        'ngivr:project-defaults',
        'common',
        'cssmin',
        'ngivr-ngtemplates-override',

        'concat:bower',
        'concat:ngivr',
//        'copy:babel',
    ]);
    grunt.registerTask('common-build-2', [
        'concat:js',
        'concat:css',
        'copy:completed',
    ])

    grunt.registerTask('ngivr-build', async function () {
        const done = this.async();
        try {
            const [jsSha, cssSha] = await Promise.all([
                utils.hash.file('dist/client/all.js'),
                utils.hash.file('dist/client/all.css')
            ])
            const cssFile = `hash.sha256.${jsSha}.css`;
            const jsFile = `hash.sha256.${cssSha}.js`;
            const replace = `
<link rel="stylesheet" href="${cssFile}" />
<script type="text/javascript" src="${jsFile}"></script>
`;
            fs.renameSync('dist/client/all.js', 'dist/client/' + jsFile);

            fs.renameSync('dist/client/all.css', 'dist/client/' + cssFile);
            const file = 'dist/client/index.html';
            const html = fs.readFileSync(file, "utf8");
            const prefix = '<!--@build-->';
            const postfix = '<!--@build:end-->';
            const prefixIndex = html.indexOf(prefix) + prefix.length;
            const postixIndex = html.indexOf(postfix);
            const newHtml = html.substring(0, prefixIndex) + replace + html.substring(postixIndex);
            fs.writeFileSync(file, newHtml);
            done();
        } catch (e) {
            done(e);
        }
    });

    grunt.registerTask('ngivr-uglifyjs', 'NGIVR UglifyJS compiler', async function () {
        const done = this.async();

        const cwd = process.cwd();
        const path = require('path');

        try {
            const terser = require('terser')
//            const UglifyJS = require('uglify-js')
            const input = path.relative(cwd, `${__dirname}/dist/client/all.js`)
            const code = (await mz.fs.readFile(input)).toString();
            const terserResult = terser.minify(code, {
  //                  beautify: true,
                    ecma: 8,
                    compress: true,
                    mangle: false,
                    sourceMap: {
                        filename: "all.js",
                        url: "all.js.map"
                    },
                    keep_fnames: true,
                }
            );
            let result = `${banner}
${terserResult.code}
`
            await mz.fs.writeFile(input, result);
            await mz.fs.writeFile(path.relative(cwd, `${__dirname}/dist/client/sygnus-secure-map-919-939-979.map`), terserResult.map);
            done();
        } catch (e) {
            done(e)
        }
    })

    grunt.registerTask('build', (target) => {

        if (target === 'nice' || target === 'babel') {
            return grunt.task.run([
                'clean:tmp',
                'clean:dist',
                'common-build',
//                'babel',
                'copy:dist',
                'copy:fonts',
                'common-build-2',
                'ngivr-build',
                'clean:tmp',
            ]);

        }

        return grunt.task.run([
            'clean:tmp',
            'clean:dist',
            'common-build',
//            'babel',
            'copy:dist',
            'copy:fonts',
            'common-build-2',
            'ngivr-uglifyjs',
            'ngivr-build',
            'clean:tmp',
        ]);
    });

    grunt.registerTask('default', [
        'test',
        'build'
    ]);

    const upgrade = ['ngivr:upgrade'];
    grunt.registerTask('upgrade', upgrade);
    grunt.registerTask('release', ['test', 'build']);

};


