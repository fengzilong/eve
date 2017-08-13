abstract class Seed {
	public static component = () => {};
	public static directive = () => {};
	public static filter = () => {};

	private _data: Object;

	constructor() {
		if ( typeof this.data === 'function' ) {
			this.data();
		}
	}

	public abstract onCreated(): void;
	public abstract onMounted(): void;
	public abstract onDisposed(): void;
	public abstract data(): void;

	public $mount() {
		this.onCreated();
		this.onMounted();
	}

	public $unmount() {
		this.onDisposed();
	}

	public $update() {

	}
}

export default Seed;
