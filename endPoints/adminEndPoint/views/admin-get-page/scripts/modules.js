//
// Cookie
//

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

//
// Get
//

export async function getHeader(token) {
	return await (
		await fetch('/admin/api/header', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

export async function getPropagandas(token) {
	return await (
		await fetch('/admin/api/propagandas', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

export async function getCategories(token) {
	return await (
		await fetch('/admin/api/categories', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

//
// Build
//

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

export async function buildPropagandas(isLastItemNew = false) {
	const propagandas = await getPropagandas(token);

	const template = window.document.querySelector(
		'template[propaganda-template]',
	);

	template.parentElement.querySelectorAll('tr[original-item]').forEach((tr) => {
		tr.remove();
	});

	propagandas.reverse().forEach((propaganda, index) => {
		const templateUsable = template.content.cloneNode(true).children[0];

		templateUsable.setAttribute('original-item', '');
		templateUsable
			.querySelector('td[action-container]')
			.classList.add('--no-send-button');
		templateUsable.setAttribute('identifier', propaganda.id);

		templateUsable
			.querySelectorAll('div[cell-container]')
			.forEach((cell, index) => {
				cell.setAttribute(
					'action',
					'/admin/api/propagandas/' + (index === 0 ? 'bigImage' : 'smallImage'),
				);

				cell.querySelectorAll('div[file-input-container]').forEach((div) => {
					const key = generateRandomString(30);

					div.querySelector('label').setAttribute('for', key);
					const input = div.querySelector('input');

					input.setAttribute('id', key);

					input.addEventListener('input', async (e) => {
						const form = new FormData();

						form.append('file', e.target.files[0]);
						form.append('id', String(propaganda.id));

						await handleCellRequest(token, cell, form);
					});

					const link = div.querySelector('a');
					link.setAttribute(
						'href',
						index === 0 ? propaganda.bigImage : propaganda.smallImage,
					);
					link.innerText = link.innerText + ' ' + propaganda.id;

					handleImageInput(div);
				});
			});

		const actionContainer = templateUsable.querySelector(
			'td[action-container]',
		);
		const actionButtons = actionContainer.querySelectorAll('button');

		actionButtons[2].addEventListener('click', async () => {
			let form = {};

			form['id'] = String(propaganda.id);

			form = JSON.stringify(form);

			const req = await handleActionRequest(
				token,
				actionContainer,
				'/admin/api/propaganda',
				'DELETE',
				form,
				'application/json',
			);

			if (req) {
				buildPropagandas();
			}
		});

		if (isLastItemNew && index === 0) {
			templateUsable.querySelector('div[action-info]').classList.add('--ok');
		}

		template.parentElement.prepend(templateUsable);
	});

	handleTableVisibility();

	template.parentElement.setAttribute('sortable-propagandas', '');

	addSortableList('sortable-propagandas', async () => {
		let ids = [];

		template.parentElement
			.querySelectorAll('tr[original-item]')
			.forEach((tr) => {
				ids.push(tr.getAttribute('identifier'));
			});

		const form = JSON.stringify({
			ids,
		});

		await fetch('/admin/api/propagandas', {
			method: 'PUT',
			headers: {
				authorization: 'Bearer ' + token,
				'Content-Type': 'application/json',
			},
			body: form,
		});
	});

	if (
		template.parentElement.querySelectorAll('tr[original-item]').length <= 1
	) {
		destroySortableList('sortable-propagandas');
	}

	handleTableVisibility();
}

export async function buildCategories(isLastItemNew = false) {
	const categories = await getCategories(token);

	const template = window.document.querySelector(
		'template[categories-template]',
	);

	template.parentElement.querySelectorAll('tr[original-item]').forEach((tr) => {
		tr.remove();
	});

	categories.reverse().forEach((category, index) => {
		const templateUsable = template.content.cloneNode(true).children[0];

		templateUsable.setAttribute('original-item', '');
		templateUsable
			.querySelector('td[action-container]')
			.classList.add('--no-send-button');
		templateUsable.setAttribute('identifier', category.id);

		templateUsable.querySelectorAll('div[cell-container]').forEach((cell) => {
			cell.setAttribute('action', '/admin/api/categories/name');

			cell.querySelectorAll('div[pseudo-input]').forEach(async (div) => {
				div.innerText = category.name;

				loadPseudoInputProperties(div);

				let lastValue = div.innerText;

				div.addEventListener('focusout', async () => {
					const currentValue = div.innerText;

					if (currentValue === lastValue) {
						return;
					}

					let form = {
						id: String(category.id),
						name: div.innerText,
					};

					form = JSON.stringify(form);

					await handleCellRequest(token, cell, form, 'application/json');

					lastValue = currentValue;
				});
			});
		});

		const actionContainer = templateUsable.querySelector(
			'td[action-container]',
		);
		const actionButtons = actionContainer.querySelectorAll('button');

		actionButtons[2].addEventListener('click', async () => {
			let form = {};

			form['id'] = String(category.id);

			form = JSON.stringify(form);

			const req = await handleActionRequest(
				token,
				actionContainer,
				'/admin/api/category',
				'DELETE',
				form,
				'application/json',
			);

			if (req) {
				buildCategories();
			}
		});

		if (isLastItemNew && index === 0) {
			templateUsable.querySelector('div[action-info]').classList.add('--ok');
		}

		template.parentElement.prepend(templateUsable);
	});

	handleTableVisibility();

	template.parentElement.setAttribute('sortable-categories', '');

	addSortableList('sortable-categories', async () => {
		let ids = [];

		template.parentElement
			.querySelectorAll('tr[original-item]')
			.forEach((tr) => {
				ids.push(tr.getAttribute('identifier'));
			});

		const form = JSON.stringify({
			ids,
		});

		await fetch('/admin/api/categories', {
			method: 'PUT',
			headers: {
				authorization: 'Bearer ' + token,
				'Content-Type': 'application/json',
			},
			body: form,
		});
	});

	if (
		template.parentElement.querySelectorAll('tr[original-item]').length <= 1
	) {
		destroySortableList('sortable-categories');
	}
}

//
// Build Template
//

export function buildPropagandasTemplate(specialSection) {
	const template = specialSection
		.querySelector('template[propaganda-template]')
		.content.cloneNode(true).children[0];

	template.setAttribute('pseudo-item', '');

	template
		.querySelector('td[action-container]')
		.classList.add('--no-drag-button');

	template.querySelectorAll('div[file-input-container]').forEach((div) => {
		const key = generateRandomString(30);

		div.querySelector('label').setAttribute('for', key);
		div.querySelector('input').setAttribute('id', key);

		handleImageInput(div);
	});

	const actionContainer = template.querySelector('td[action-container]');
	const actionButtons = actionContainer.querySelectorAll('button');

	actionButtons[1].addEventListener('click', async () => {
		const form = new FormData();
		const files = template.querySelectorAll('input');

		form.append('files', files[0].files[0]);
		form.append('files', files[1].files[0]);

		form.append('imagesContext', 'bigImage');
		form.append('imagesContext', 'smallImage');

		const req = await handleActionRequest(
			token,
			actionContainer,
			'/admin/api/propaganda',
			'POST',
			form,
		);

		if (req) {
			template.setAttribute('original-item', '');
			buildPropagandas(true);
		}
	});

	actionButtons[2].addEventListener('click', () => {
		template.remove();
		handleTableVisibility();
	});

	return template;
}

export function buildCategoriesTemplate(specialSection) {
	const template = specialSection
		.querySelector('template[categories-template]')
		.content.cloneNode(true).children[0];

	template.setAttribute('pseudo-item', '');

	template
		.querySelector('td[action-container]')
		.classList.add('--no-drag-button');

	template.querySelectorAll('div[pseudo-input]').forEach((div) => {
		loadPseudoInputProperties(div);
	});

	const actionContainer = template.querySelector('td[action-container]');
	const actionButtons = actionContainer.querySelectorAll('button');

	actionButtons[1].addEventListener('click', async () => {
		let form = {
			name: template.querySelector('div[pseudo-input]').innerText,
		};
		console.log(form);

		form = JSON.stringify(form);

		const req = await handleActionRequest(
			token,
			actionContainer,
			'/admin/api/category',
			'POST',
			form,
			'application/json',
		);

		if (req) {
			template.setAttribute('original-item', '');
			buildCategories(true);
		}
	});

	actionButtons[2].addEventListener('click', () => {
		template.remove();
		handleTableVisibility();
	});

	return template;
}

//
// Others
//

export function loadPseudoInputProperties(div) {
	let lastInput = div.innerText;

	div.addEventListener('input', () => {
		const value = div.innerText;
		const maxLength = Number(div.getAttribute('maxlength'));

		if (value.length > maxLength) {
			div.innerText = lastInput;

			return;
		}

		lastInput = value;
	});

	div.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.target.blur();
			return e.preventDefault();
		}
	});
}

function addSortableList(container, callBack) {
	$(function () {
		const sortable = $(`[${container}]`).sortable({
			items: 'tr:not([pseudo-item])',
			cancel: '[pseudo-item]',
			stop: callBack,
			tolerance: 'pointer',
		});

		if (
			window.document.querySelectorAll(`[${container}] [original-item]`)
				.length < 2
		) {
			return;
		}

		$(`[${container}]`).on('mousedown', '[draggable]', function () {
			sortable.sortable('enable');
		});

		$(document).on('mouseup', function (e) {
			if (!$(e.target).closest('[draggable]').length) {
				sortable.sortable('disable');
			}
		});
	});
}

function destroySortableList(container) {
	$(function () {
		$('[' + container + ']').sortable('destroy');
	});
}

export async function handleActionRequest(
	token,
	actionContainer,
	url,
	method,
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
		method,
		headers,
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
		method: 'PUT',
		headers,
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

export function handleTableVisibility() {
	window.document.querySelectorAll('div[special-section]').forEach((div) => {
		const rows = div.querySelectorAll('tr[table-row]');

		if (rows.length === 0) {
			div.querySelector('div[table-container]').classList.add('--off');
		} else {
			div.querySelector('div[table-container]').classList.remove('--off');
		}
	});
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