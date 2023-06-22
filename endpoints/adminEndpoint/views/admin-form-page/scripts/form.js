/**
 * Retrieves the authentication token from the cookies.
 *
 * @returns {string|null} The token value if found, or null if not found.
 */
function getToken() {
	const cookies = document.cookie.split(';');

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();

		if (cookie.startsWith('token=')) {
			document.cookie =
				'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

			return cookie.substring('token'.length + 1);
		}
	}

	return null;
}

const token = getToken();

/**
 * Event listener for form submission. It sends a request to the specified action URL with the form data.
 * Displays a success message if the request is successful, or an error message otherwise.
 */
window.document.querySelector('form').addEventListener('submit', async (e) => {
	e.preventDefault();

	const action = e.target.getAttribute('action');
	const method = e.target.getAttribute('method');

	let form = {};

	window.document.querySelectorAll('input').forEach((input) => {
		form[input.getAttribute('name')] = input.value;
	});

	form = JSON.stringify(form);

	const req = await fetch(action, {
		method,
		headers: {
			authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: form,
	});

	const res = await req.json();

	const element = window.document.querySelector('span[message-container]');

	if (res.status === 200) {
		element.querySelector('i[message]').innerText =
			'Dados atualizados com successo.';
		element.classList.add('--ok');
		e.target.querySelector('button[submit-button]').classList.add('--off');
		e.target.querySelector('a[link-button]').setAttribute('class', '--on');
	} else {
		element.querySelector('i[message]').innerText =
			res.status === 401
				? 'Desculpe, algo deu errado. Por favor, atualize o site para tentar novamente.'
				: res.message;
		element.classList.add('--not-ok');
	}
});
