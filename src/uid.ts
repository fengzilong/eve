const prefix = '(>ε<)';
let id = 0;

export default function () {
	return `${ prefix }_${ id++ }`;
};
