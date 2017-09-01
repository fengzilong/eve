export default function IfStatement ( { test, consequent = [], alternate = [] } ) {
	return {
		type: 'IfStatement',
		test,
		consequent,
		alternate,
	}
}
