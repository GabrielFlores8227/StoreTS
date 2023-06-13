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
// Builder
////

export async function buildIcon() {
	const { icon } = await getHeader(token);

	window.document
		.querySelector('link[rel="shortcut icon"]')
		.setAttribute('href', icon);
}

export async function buildLogo() {
	const { logo } = await getHeader(token);

	window.document.querySelectorAll('img[logo]').forEach((img) => {
		img.setAttribute('src', logo);
	});
}

export async function buildTitle() {
	const { title } = await getHeader(token);

	window.document.querySelector('title').innerText = title + ' | Admin';
}

export async function buildColor() {
	const { color } = await getHeader(token);

	window.document.documentElement.style.setProperty('--primary-color', color);
}

////
// Build
////

export function buildPropagandasTemplate(specialSection) {
	const template = specialSection
		.querySelector('template')
		.content.cloneNode(true).children[0];

	template.querySelectorAll('div[file-input-container]').forEach((div) => {
		const key = generateRandomString(30);

		div.querySelector('label').setAttribute('for', key);
		div.querySelector('input').setAttribute('id', key);

		handleImageInput(div);
	});

	const actionContainer = template.querySelector('td[action-container]');
	const actionButtons = actionContainer.querySelectorAll('button');

	actionButtons[0].addEventListener('click', async () => {
		const form = new FormData();
		const files = template.querySelectorAll('input');

		form.append('files', files[0].files[0]);
		form.append('files', files[1].files[0]);

		form.append('imagesContext', 'bigImage');
		form.append('imagesContext', 'smallImage');

		await handleActionRequest(
			token,
			actionContainer,
			'/admin/api/propaganda',
			form,
		);
	});

	actionButtons[1].addEventListener('click', () => {
		template.remove();
		handleTableVisibility(specialSection);
	});

	return template;
}

////
// Others
////

export async function handleActionRequest(
	token,
	actionContainer,
	url,
	body,
	contentType = undefined,
) {
	$('--loading');

	const headers = {
		authorization: 'Bearer ' + token,
	};

	if (contentType) {
		headers['Content-Type'] = contentType;
	}

	const req = await fetch(url, {
		headers,
		method: 'POST',
		body,
	});

	const { status, message } = await req.json();

	if (status === 200) {
		$('--ok');

		return true;
	} else {
		if (status === 401) {
			window.document.querySelector('div[warning]').classList.add('--on');
		}

		$('--error', message);

		return false;
	}

	function $(add, title = undefined) {
		const states = ['--loading', '--error', '--ok'];
		const info = actionContainer.querySelector('div[action-info]');

		states.forEach((state) => {
			if (info.classList.contains(state)) {
				info.classList.remove(state);
			}
		});

		info.classList.add(add);

		if (title) {
			info.querySelector('i[action-info-error]').setAttribute('title', title);
		}
	}
}

export async function handleCellRequest(
	token,
	cell,
	body,
	contentType = undefined,
) {
	$('--loading');

	const action = cell.getAttribute('action');

	const headers = {
		authorization: 'Bearer ' + token,
	};

	if (contentType) {
		headers['Content-Type'] = contentType;
	}

	const req = await fetch(action, {
		headers,
		method: 'PUT',
		body,
	});

	const { status, message } = await req.json();

	if (status === 200) {
		$('--ok');

		return true;
	} else {
		if (status === 401) {
			window.document.querySelector('div[warning]').classList.add('--on');
		}

		$('--error', message);

		return false;
	}

	function $(add, title = undefined) {
		const states = ['--loading', '--error', '--ok'];
		const info = cell.querySelector('div[cell-info]');

		states.forEach((state) => {
			if (info.classList.contains(state)) {
				info.classList.remove(state);
			}
		});

		info.classList.add(add);

		if (title) {
			info.querySelector('i[cell-info-error]').setAttribute('title', title);
		}
	}
}

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

export function handleImageInput(div) {
	const link = div.querySelector('a');
	const fileInput = div.querySelector('input');

	fileInput.addEventListener('input', (e) => {
		const file = e.target.files[0];
		const fileURL = URL.createObjectURL(file);

		link.href = fileURL;
		link.innerText = e.target.files[0].name;
	});
}

export function handleTableVisibility(div) {
	const rows = div.querySelectorAll('tr[table-row]');

	if (rows.length === 0) {
		div.querySelector('div[table-container]').classList.add('--off');
	} else {
		div.querySelector('div[table-container]').classList.remove('--off');
	}
}

function generateRandomString(length) {
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters.charAt(randomIndex);
	}

	return result;
}
