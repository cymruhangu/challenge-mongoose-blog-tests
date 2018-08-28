'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://admin:D0nt4g3t!@ds133642.mlab.com:33642/blog-app';

exports.TEST_DATABASE_URL =
   process.env.TEST_DATABASE_URL || 'mongodb://admin:D0nt4g3t!@ds133642.mlab.com:33642/test-blog-app';
exports.PORT = process.env.PORT || 8080;