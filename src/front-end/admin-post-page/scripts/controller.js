(async () => {
	const header = await (await fetch('/api/header')).json();

	buildLogo(header);
	buildHead(header);
	setAdminTitle();
	buildAsideMenus([
		{ selector: 'open-config-aside-menu-button', element: document.querySelector('aside[config-aside-menu]'), action: 'add' },
		{ selector: 'close-config-aside-menu-button', element: document.querySelector('aside[config-aside-menu]'), action: 'remove' },
	]);
})();

(() => {
	window.document.querySelector('form[change-password-form]').addEventListener('submit', async (e) => {
		e.preventDefault();

		const token = getToken();

		const oldPassword = window.document.querySelector('input[oldPassword]');
		const newPassword = window.document.querySelector('input[newPassword]');

		const req = await fetch('/admin/api/password', {
			method: 'POST',
			headers: new Headers({
				authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			}),
			body: JSON.stringify({ oldPassword: oldPassword.value, newPassword: newPassword.value }),
		});

		const res = await req.json();

		const element = window.document.querySelector('span[message-container]');

		if (res.status === 200) {
			element.querySelector('i[message]').innerText = 'Your password has been successfully update';
			if (element.classList.contains('--not-ok')) {
				element.classList.remove('--not-ok');
			}

			element.classList.add('--not-ok');

			element.classList.add('--ok');

			oldPassword.value = '';
			newPassword.value = '';
		} else {
			element.querySelector('i[message]').innerText = res.message.replace('oldPassword', 'Old Password').replace('newPassword', 'New Password').replace('Unauthorized', 'Oops! something went wrong, update the page and try again');
			if (element.classList.contains('--ok')) {
				element.classList.remove('--ok');
			}

			element.classList.add('--not-ok');
		}
	});
})();

(() => {
	window.document.querySelectorAll('div[input-file-container]').forEach((element) => {
		element.querySelector('input').addEventListener('input', (e) => {
			const link = element.querySelector('a');
			const file = e.target.files[0];

			link.innerText = file.name;
			link.setAttribute('href', window.URL.createObjectURL(file));
		});
	});
})();
