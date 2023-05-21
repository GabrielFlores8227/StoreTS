(async () => {
	const header = await (await fetch('/api/header')).json();

	buildLogo(header);
	displayLoadingScreen();

	const propagandas = await (await fetch('/api/propagandas')).json();
	const products = await (await fetch('/api/products')).json();
	const footer = await (await fetch('/api/footer')).json();

	clearLocalStorage(products);

	buildHead(header);
	buildAsideMenus(products);
	buildSearchBar(products);
	buildPropagandas(propagandas, footer);
	buildProducts(products);
	buildFooter(footer);

	const images = window.document.querySelectorAll('img');
	let loadedCount = 0;

	images.forEach(function (image) {
		image.addEventListener('load', function () {
			loadedCount++;
			updateLoadingProgressBar((loadedCount / images.length) * 100);

			if (loadedCount === images.length) {
				removeLoadingScreen();

				setTimeout(() => {
					handleNotifications(header, products);
				}, 3500);
			}
		});
	});
})();
