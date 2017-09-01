// @flow
export default function ( options?:{ body?: any } ) {
	return {
		type: 'Expression',
		body: options.body,
	}
}
