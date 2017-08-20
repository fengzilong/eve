import { isSelfClosedTag } from '../is'

test( 'isSelfClosedTag', () => {
	expect( isSelfClosedTag( 'img' ) ).toBe( true )
	expect( isSelfClosedTag( 'span' ) ).toBe( false )
} )
