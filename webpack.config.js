const path = require( 'path' );

module.exports = {
	entry: './src/index.ts',
	output: {
		path: path.resolve( __dirname, 'dist' ),
		filename: 'pulse.js',
		libraryTarget: 'umd',
		library: 'Pulse',
	},
	resolve: {
		extensions: [ '', '.ts','.js' ],
	},
	module: {
		loaders: [
			{ test: /\.(ts|js)$/, loader: 'babel-loader!ts-loader' },
		],
	},
};
