import * as modules from '/home-page/scripts/modules.js';

(async () => {
	const header = await (await fetch('/api/header')).json();

	modules.buildLogo(header.logo);

	modules.displayLoadingScreen();

	const propagandas = await (await fetch('/api/propagandas')).json();
	const products = await (await fetch('/api/products')).json();
	const footer = await (await fetch('/api/footer')).json();

	modules.clearLocalStorage(products);

	modules.buildHead(header);
	modules.buildAsideMenus(products);
	modules.buildSearchBar(products);
	modules.buildPropagandas(propagandas, footer);
	modules.buildProducts(products);
	modules.buildFooter(footer);

	const images = document.querySelectorAll('img');
	let loadedCount = 0;

	images.forEach(function (image) {
		image.addEventListener('load', function () {
			loadedCount++;

			modules.updateLoadingProgessBar((loadedCount / images.length) * 100);

			if (loadedCount === images.length) {
				modules.removeLoadingScreen();

				setTimeout(() => {
					modules.handleNotifications(header, products);
				}, 7000);
			}
		});
	});
})();
