import isSelfClosedTag from '../isSelfClosedTag'

test( 'isSelfClosedTag', () => {
	expect( isSelfClosedTag( 'img' ) ).toBe( true )
	expect( isSelfClosedTag( 'span' ) ).toBe( false )
} )
