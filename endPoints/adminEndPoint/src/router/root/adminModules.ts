export default class AdminModules {
	private static throwError(
		key: string,
		unthorized?: boolean,
		redirect?: boolean,
		url?: string,
	) {
		const error: any = {
			status: unthorized ? 401 : 400,
			message:
				'Please provide the ' + key + ' correctly to fulfill the request',
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
		unthorized?: boolean,
		redirect?: boolean,
		url?: string,
	) {
		if (data.length < minLength || data.length > maxLength) {
			this.throwError(key, unthorized, redirect, url);
		}
	}

	public static checkType(
		data: any,
		type: string,
		key: string,
		unthorized?: boolean,
		redirect?: boolean,
		url?: string,
	) {
		if (typeof data !== type) {
			this.throwError(key, unthorized, redirect, url);
		}
	}
}
