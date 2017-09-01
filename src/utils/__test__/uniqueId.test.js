import uniqueId from '../uniqueId'

test( 'uniqueId works', () => {
	const uniqueId1 = uniqueId()
	const uniqueId2 = uniqueId()
	expect( uniqueId1 === uniqueId2 ).toBe( false )
} )
