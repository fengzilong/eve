import { SVG_NAMESPACE, HTML_NAMESPACE, SVG_TAGS, SELF_CLOSE_TAGS } from '../src/shared/constants';

test( 'basic', () => {
	expect( SVG_NAMESPACE ).toBeDefined();
	expect( HTML_NAMESPACE ).toBeDefined();
	expect( SVG_TAGS ).toBeDefined();
	expect( SELF_CLOSE_TAGS ).toBeDefined();
} );
