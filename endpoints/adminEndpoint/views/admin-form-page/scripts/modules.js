/**
 * Updates the message container element based on the provided status and message.
 *
 * @param {string} status - The status of the message (e.g., "ok", "error").
 * @param {string} [message] - The message to be displayed.
 */
export function handleMessage(status, message = undefined) {
	window.document
		.querySelector('div[message-container]')
		.setAttribute('class', `--${status}`);

	if (['ok', 'error'].includes(status)) {
		window.document.querySelector(`i[${status}]`).innerText = message;
	}
}
