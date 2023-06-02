export default class AdminModules {
	private static throwError(
		message: string,
		unauthorized?: boolean,
		redirect?: boolean,
		url?: string,
	) {
		const error: any = {
			status: unauthorized ? 401 : 400,
			message,
		};

		if (redirect && url) {
			error.redirect = redirect;
			error.url = url;
		}

		throw error;
	}

	public static checkLength(
		data: any,
		minLength: number,
		maxLength: number,
		key: string,
		unauthorized?: boolean,
		redirect?: boolean,
		url?: string,
	) {
		if (typeof data === 'string') {
			data = data.trim();
		}

		if (data.length < minLength) {
			this.throwError(
				'please provide the ' + key + ' correctly',
				unauthorized,
				redirect,
				url,
			);
		}

		if (data.length > maxLength) {
			this.throwError(
				key + ' is too long, please provide the data correctly',
				unauthorized,
				redirect,
				url,
			);
		}
	}

	public static checkType(
		data: any,
		type: string,
		key: string,
		unauthorized?: boolean,
		redirect?: boolean,
		url?: string,
	) {
		if (typeof data !== type) {
			this.throwError(
				key + ' is ' + typeof data + ', please provide the data correctly',
				unauthorized,
				redirect,
				url,
			);
		}
	}

	public static checkNumber(
		data: any,
		key: string,
		unauthorized?: boolean,
		redirect?: boolean,
		url?: string,
	) {
		if (isNaN(data)) {
			this.throwError(
				key + ' is not a number, please provide the data correctly',
				unauthorized,
				redirect,
				url,
			);
		}
	}

	public static checkValue(
		data: any,
		minValue: number,
		maxValue: number,
		key: string,
		unauthorized?: boolean,
		redirect?: boolean,
		url?: string,
	) {
		if (data < minValue) {
			this.throwError(
				key + ' is too small, please provide the data correctly',
				unauthorized,
				redirect,
				url,
			);
		}

		if (data > maxValue) {
			this.throwError(
				key + ' is too big, please provide the data correctly',
				unauthorized,
				redirect,
				url,
			);
		}
	}
}
