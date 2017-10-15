const pkg = require( './package.json' )

module.exports = {
	plugins: [
	],
	format: 'all',
	// compress: true,
	moduleName: 'Eve',
	banner: {
		name: 'Eve',
		version: pkg.version,
		author: 'fengzilong',
		license: 'MIT',
		year: new Date().getFullYear()
	},
	replace: {
		VERSION: JSON.stringify( pkg.version ),
	},
	env: {
		NODE_ENV: 'development'
	},
	flow: true,
	browser: true,
	esModules: true
}
