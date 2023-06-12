////
// Cookie
////

function getToken() {
	const cookies = document.cookie.split(';');

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();

		if (cookie.startsWith('token' + '=')) {
			document.cookie =
				'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

			return cookie.substring('token'.length + 1);
		}
	}

	return null;
}

export const token = getToken();

////
// Get
////

export async function getHeader(token) {
	return await (
		await fetch('/admin/api/header', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

////
// Others
////

export function buildAsideMenus(asideButtonHandler) {
	const addClickHandler = (selector, element, action) => {
		document.querySelectorAll(`button[${selector}]`).forEach((button) => {
			button.addEventListener('click', () => {
				setTimeout(() => {
					element.classList[action]('--on');
				}, 120);
			});
		});
	};

	asideButtonHandler.forEach(({ selector, element, action }) => {
		addClickHandler(selector, element, action);
	});
}

export async function handleCellRequest(token, cell, body) {
	$('--loading');

	const action = cell.getAttribute('action');
	const method = cell.getAttribute('method');

	const req = await fetch(action, {
		headers: {
			authorization: 'Bearer ' + token,
		},
		method,
		body,
	});

	const { status, message } = await req.json();

	if (status === 200) {
		$('--ok');
	} else {
		$('--error', message);
	}

	function $(add, title = undefined) {
		const states = ['--loading', '--error', '--ok'];
		const info = cell.querySelector('div[info]');

		states.forEach((state) => {
			if (info.classList.contains(state)) {
				info.classList.remove(state);
			}
		});

		info.classList.add(add);

		if (title) {
			info.querySelector('i[info-error]').setAttribute('title', title);
		}
	}
}

////
// CallBack
////

export async function handleIconCallBack() {
	const { icon } = await getHeader(token);

	window.document
		.querySelector('link[rel="shortcut icon"]')
		.setAttribute('href', icon);
}

export async function handleLogoCallBack() {
	const { logo } = await getHeader(token);

	window.document.querySelectorAll('img[logo]').forEach((img) => {
		img.setAttribute('src', logo);
	});
}
