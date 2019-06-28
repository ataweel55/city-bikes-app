module.exports = function(grunt) {
  'use strict';
  grunt.initConfig({
    babel: {
      options: {
        sourceMap: true,
        presets: [
          [
            'env',
            {
              targets: {
                browsers: ['last 2 versions']
              }
            }
          ]
        ],
        plugins: [
          'transform-async-to-generator',
          'transform-object-rest-spread'
        ]
      },
      tmp: {
        expand: true,
        cwd: 'tmp',
        src: ['**/*.js', '!vendor/**', '!test/**'],
        dest: 'tmp'
      }
    },
    watch: {
      scripts: {
        files: ['webapp/**']
      },
      options: {
        livereload: 35729
      }
    },
    prettier: {
      files: {
        src: [
          'webapp/**/**.js',
          'webapp/**/**.css',
          '!webapp/vendor/**/**.js',
          '!webapp/vendor/**/**.css'
        ]
      }
    },
    connect: {
      options: {
        protocol: 'https',
        port: 9000,
        hostname: '*',
        livereload: 35729
      },
      src: {},
      dist: {}
    },
    openui5_connect: {
      options: {
        resources: [
          'bower_components/openui5-sap.ui.core/resources',
          'bower_components/openui5-sap.tnt/resources',
          'bower_components/openui5-sap.m/resources',
          'bower_components/openui5-themelib_sap_belize/resources',
          'bower_components/openui5-sap.ui.layout/resources',
          'vendor/sapui5-vbm/resources',
          'vendor/sapui5-suite-microchart/resources'
        ]
      },
      src: {
        options: {
          appresources: 'webapp'
        }
      },
      dist: {
        options: {
          appresources: 'dist'
        }
      }
    },

    openui5_preload: {
      component: {
        options: {
          resources: {
            cwd: 'tmp',
            prefix: 'com/sovanta/city_bikes',
            compatVersion: 'edge',
            src: [
              '**/*.js',
              '**/*.fragment.html',
              '**/*.fragment.json',
              '**/*.fragment.xml',
              '**/*.view.html',
              '**/*.view.json',
              '**/*.view.xml',
              '**/*.properties',
              'manifest.json',
              '!test/**',
              '!vendor/**'
            ]
          },
          dest: 'dist'
        },
        components: true
      }
    },

    clean: {
      dist: 'dist',
      tmp: 'tmp'
    },

    copy: {
      resources: {
        files: [
          {
            cwd: 'node_modules/babel-polyfill/dist/',
            src: 'polyfill.min.js',
            dest: 'dist/',
            expand: true
          },
          {
            cwd: 'bower_components/openui5-sap.ui.core/resources',
            src: ['**/*'],
            dots: true,
            expand: true,
            dest: 'dist/resources/'
          },
          {
            cwd: 'bower_components/openui5-sap.m/resources',
            src: ['**/*'],
            dots: true,
            expand: true,
            dest: 'dist/resources/'
          },
          {
            cwd: 'bower_components/openui5-sap.tnt/resources',
            src: ['**/*'],
            dots: true,
            expand: true,
            dest: 'dist/resources/'
          },
          {
            cwd: 'bower_components/openui5-themelib_sap_belize/resources',
            src: ['**/*'],
            dots: true,
            expand: true,
            dest: 'dist/resources/'
          },
          {
            cwd: 'bower_components/openui5-sap.ui.layout/resources',
            src: ['**/*'],
            dots: true,
            expand: true,
            dest: 'dist/resources/'
          },
          {
            cwd: 'vendor/sapui5-vbm/resources',
            src: ['**/*'],
            dots: true,
            expand: true,
            dest: 'dist/resources/'
          },
          {
            cwd: 'vendor/sapui5-suite-microchart/resources',
            src: ['**/*'],
            dots: true,
            expand: true,
            dest: 'dist/resources/'
          }
        ]
      },
      tmp: {
        files: [
          {
            expand: true,
            cwd: 'webapp',
            src: ['**', '!test/**'],
            dest: 'tmp'
          }
        ]
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: 'tmp',
            src: ['**'],
            dest: 'dist'
          }
        ]
      }
    },

    eslint: {
      webapp: ['webapp']
    }
  });

  grunt.loadNpmTasks('grunt-babel');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-openui5');

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-prettier');

  // Server task
  grunt.registerTask('serve', function(target) {
    grunt.task.run('openui5_connect:' + (target || 'src') + ':keepalive');
  });

  // Linting task
  grunt.registerTask('lint', ['eslint']);

  // Build task
  grunt.registerTask('build', [
    'clean:tmp',
    'copy:tmp',
    'babel:tmp',
    'clean:dist',
    'openui5_preload',
    'copy:resources',
    'copy:dist'
  ]);

  grunt.registerTask('serveLive', function(target) {
    grunt.task.run('openui5_connect:' + (target || 'src') + ':livereload');
    grunt.task.run('watch');
  });

  // Default task
  grunt.registerTask('default', ['serveLive']);
};
