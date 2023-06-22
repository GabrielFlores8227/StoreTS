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
 * Immediately invoked function expression (IIFE) that handles storing and retrieving input values
 * in the session storage to maintain state across page reloads or navigations.
 */
(() => {
	let auth = JSON.parse(Object(sessionStorage.getItem('auth')));
	const inputs = window.document.querySelectorAll('input');

	if (window.location.href != auth.dataOwner) {
		sessionStorage.clear();
		sessionStorage.setItem(
			'auth',
			JSON.stringify({
				dataOwner: window.location.href,
				inputs: [],
			}),
		);
	}

	auth = JSON.parse(sessionStorage.getItem('auth'));

	inputs.forEach((input, index) => {
		if (!auth.inputs[index]) {
			auth.inputs.push('');
		}

		input.value = auth.inputs[index];

		input.addEventListener('input', (e) => {
			auth.inputs[index] = e.target.value;
			sessionStorage.setItem('auth', JSON.stringify(auth));
		});
	});
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
