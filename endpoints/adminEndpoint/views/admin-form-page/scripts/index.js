/**
 * Immediately invoked function expression (IIFE) that retrieves the 'message' parameter from the URL query string
 * and updates the message element if the parameter is present.
 */
(() => {
	const message = new URLSearchParams(window.location.search).get('message');

	if (message) {
		const element = window.document.querySelector('span[message-container]');

		element.querySelector('i[message]').innerText = message;
		element.classList.add('--not-ok');
	}
})();

/**
 * Immediately invoked function expression (IIFE) that enables toggling of password visibility for input fields.
 * It adds event listeners to buttons with the attribute 'toggle-password-input' to toggle the visibility of associated input fields.
 * When clicked, the button changes the input field type between 'password' and 'text', and updates the icon accordingly.
 */
(() => {
	window.document
		.querySelectorAll('button[toggle-password-input]')
		.forEach((button) => {
			const input = button.parentElement.querySelector('input');
			let state = false;

			if (input.getAttribute('type') === 'password') {
				button.classList.add('--on');
			}

			button.addEventListener('click', () => {
				if (state) {
					input.setAttribute('type', 'password');
					button.querySelector('i').setAttribute('class', 'fa-solid fa-eye');
				} else {
					input.setAttribute('type', 'text');
					button
						.querySelector('i')
						.setAttribute('class', 'fa-solid fa-eye-slash');
				}

				state = !state;
			});
		});
})();
