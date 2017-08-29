// @flow

import traverse from './traverse'
// visitors
import element from './visitors/element'
import condition from './visitors/condition'
import each from './visitors/each'

export default function createRender( ast ) {
	return function ( data: Object ) {
		const vd = traverse( ast, {
			data,
			visitors: { element, condition, each }
		} )

		return vd
	}
}
