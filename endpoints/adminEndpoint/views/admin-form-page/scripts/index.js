(() => {
	const message = new URLSearchParams(window.location.search).get('message');

	if (message) {
		const element = window.document.querySelector('span[message-container]');

		element.querySelector('i[message]').innerText = message;
		element.classList.add('--not-ok');
	}
})();

(() => {
	const username = window.document.querySelector('[username]');
	const password = window.document.querySelector('[password]');

	if (!sessionStorage.getItem('auth')) {
		sessionStorage.setItem(
			'auth',
			JSON.stringify({ username: username.value, password: password.value }),
		);
	}

	const auth = JSON.parse(sessionStorage.getItem('auth'));

	if (auth.username) {
		username.value = auth.username;
	}

	if (auth.password) {
		password.value = auth.password;
	}

	username.addEventListener('input', () => {
		auth.username = username.value;

		sessionStorage.setItem('auth', JSON.stringify(auth));
	});

	password.addEventListener('input', () => {
		auth.password = password.value;

		sessionStorage.setItem('auth', JSON.stringify(auth));
	});
})();
