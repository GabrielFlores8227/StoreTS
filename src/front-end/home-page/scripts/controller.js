(async () => {
	const header = await (await fetch('/api/header')).json();

	buildLogo(header.logo);

	buildLoadingScreen()

	const propagandas = await (await fetch('/api/propagandas')).json();
	const products = await (await fetch('/api/products')).json();
	const footer = await (await fetch('/api/footer')).json();

	buildHead(header);
	buildAsideMenus(products)
	buildSearchBar(products);
	buildPropagandas(propagandas, footer);
	buildProducts(products);
	buildFooter(footer)


	const images = document.querySelectorAll('img');
	let loadedCount = 0;

	images.forEach(function (image) {
		image.addEventListener('load', function () {
			loadedCount++;

			updateLoadingProgessBar((images.length / 100) * loadedCount)

			if (loadedCount === images.length) {
				removeLoadingScreen();
			}
		});
	})
})();
