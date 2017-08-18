export default function ( { sequence = '', item = '', body = [] } ) {
	return {
		type: 'EachStatement',
		sequence,
		item,
		body,
	}
}
