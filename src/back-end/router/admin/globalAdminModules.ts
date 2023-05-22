export default class GlobalAdminModules {
	/**
	 * Executes a checker object to validate multiple conditions.
	 * @param checker The checker object containing the conditions to validate.
	 * @param status The HTTP status code to use for the error response (default: 400).
	 * @param message The error message to use for the error response (default: "Please ensure that the '<key>' entry is provided accurately to fulfill the request").
	 */
	public static executeChecker(checker: { [key: string]: boolean }, options?: { status?: number; message?: string; url?: string }) {
		Object.keys(checker).forEach((key: string) => {
			if (!checker[key]) {
				throw {
					status: Object(options).status || 400,
					message: Object(options).message || 'Please ensure that the ' + key + ' entry is provided accurately to fulfill the request',
					url: Object(options).url || '/',
				};
			}
		});
	}
}
