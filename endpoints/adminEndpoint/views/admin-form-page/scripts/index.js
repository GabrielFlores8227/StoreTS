(() => {
	const message = new URLSearchParams(window.location.search).get('message');

	if (message) {
		const element = window.document.querySelector('span[message-container]');

		element.querySelector('i[message]').innerText = message;
		element.classList.add('--not-ok');
	}
})();

(() => {
	const firstInput = window.document.querySelector('[first-input]');
	const secondInput = window.document.querySelector('[second-input]');

	if (!sessionStorage.getItem('auth')) {
		sessionStorage.setItem(
			'auth',
			JSON.stringify({
				firstInput: firstInput.value,
				secondInput: secondInput.value,
			}),
		);
	}

	const auth = JSON.parse(sessionStorage.getItem('auth'));

	if (auth.firstInput) {
		firstInput.value = auth.firstInput;
	}

	if (auth.secondInput) {
		secondInput.value = auth.secondInput;
	}

	firstInput.addEventListener('input', () => {
		auth.firstInput = firstInput.value;

		sessionStorage.setItem('auth', JSON.stringify(auth));
	});

	secondInput.addEventListener('input', () => {
		auth.secondInput = secondInput.value;

		sessionStorage.setItem('auth', JSON.stringify(auth));
	});
})();
