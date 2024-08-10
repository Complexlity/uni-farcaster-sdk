export type DataOrError<T> =
	| {
		data: T;
		error: null;
	}
	| {
		data: null;
		error: any;
	}

