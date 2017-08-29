const pkg = require( './package.json' );

module.exports = {
	format: 'all',
	compress: true,
	moduleName: 'Pulse',
	banner: {
		name: 'Pulse',
		version: pkg.version,
		author: 'fengzilong',
		license: 'MIT',
		year: new Date().getFullYear()
	},
	env: {
		NODE_ENV: 'development'
	},
	flow: true,
	browser: true,
	esModules: true
};
