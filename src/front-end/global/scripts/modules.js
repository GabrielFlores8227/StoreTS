function buildLogo(header) {
	window.document.querySelectorAll('img[store-logo]').forEach((element) => {
		element.setAttribute('src', header.logo);
		element.setAttribute('alt', header.title);
	});
}

function buildHead(header) {
	window.document.querySelectorAll('meta[name="theme-color"]').forEach((element) => element.setAttribute('content', header.color));
	window.document.querySelectorAll('link[rel="shortcut icon"]').forEach((element) => element.setAttribute('href', header.icon));
	window.document.querySelectorAll('title').forEach((element) => (element.innerText = header.title));
	window.document.querySelectorAll('meta[name="description"]').forEach((element) => element.setAttribute('content', header.description));
	window.document.documentElement.style.setProperty('--primary-color', header.color);
}
