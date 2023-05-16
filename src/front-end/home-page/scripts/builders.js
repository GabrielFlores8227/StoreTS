function buildLoadingScreen() {
	const content = window.document.querySelector('div[loading-screen-container] div')

	content.querySelector("img").addEventListener("load", () => {
		content.classList.add('--on')
	});
}

function updateLoadingProgessBar(progress) {
	window.document.querySelector("div[loading-progess-bar]").style.width = progress + "%"
}

function removeLoadingScreen() {
	setTimeout(() => {
		window.document.querySelector('div[loading-screen-container]').classList.add('--off');
	}, 1400)
}

function buildHead(header) {
	window.document.querySelector('link[rel="shortcut icon"]').setAttribute('href', header.icon);
	window.document.querySelector('title').innerText = header.title;
	window.document.querySelector('meta[name="description"]').setAttribute('content', header.description);
	window.document.documentElement.style.setProperty('--primary-color', header.color);
}

function buildLogo(logo) {
	window.document.querySelectorAll('img[store-logo]').forEach((element) => {
		element.setAttribute('src', logo);
	});
}

function buildAsideMenus(products) {
	window.document.querySelectorAll("button[open-cart-aside-menu-button]").forEach(element => {
		element.addEventListener("click", () => {
			window.document.querySelector("aside[cart-aside-menu]").classList.add("--on")
		})
	})

	window.document.querySelectorAll("button[close-cart-aside-menu-button]").forEach(element => {
		element.addEventListener("click", () => {
			window.document.querySelector("aside[cart-aside-menu]").classList.remove("--on")
		})
	})

	window.document.querySelectorAll("button[open-categories-aside-menu-button]").forEach(element => {
		element.addEventListener("click", () => {
			window.document.querySelector("aside[categories-aside-menu]").classList.add("--on")
		})
	})

	window.document.querySelectorAll("button[close-categories-aside-menu-button]").forEach(element => {
		element.addEventListener("click", () => {
			window.document.querySelector("aside[categories-aside-menu]").classList.remove("--on")
		})
	})

	buildCartAsideMenu(products)
	buildCategoriesAsideMenu(products)
}

function buildCartAsideMenu(products) {
	if (!localStorage.getItem("saved")) {
		localStorage.setItem("saved", "[]")
	}

	const _localStorage = JSON.parse(localStorage.getItem("saved"))

	const templateParent = window.document.querySelector("div[cart-product-container]")

	templateParent.querySelectorAll("div").forEach(element => {
		element.remove()
	})

	const allProductIds = []

	Object.keys(products).forEach(key => {
		products[key].forEach(product => {
			allProductIds.push(product.id)

			if (!_localStorage.includes(product.id)) {
				return
			}

			const template = templateParent.querySelector("template").cloneNode(true).content.children[0]

			template.querySelector("button[remove-from-cart-button]").addEventListener("click", () => {
				template.style.height = "0px"
				template.style.filter = "opacity(0%)"

				setTimeout(() => {
					const _localStorage = JSON.parse(localStorage.getItem("saved"))		
					
					_localStorage.splice(_localStorage.indexOf(product.id), 1);

					localStorage.setItem("saved", JSON.stringify(_localStorage))

					buildCartAsideMenu(products)
				}, 350)
			})

			template.querySelector('img[product-image]').setAttribute('src', product.image);
			template.querySelector('img[product-image]').setAttribute('alt', product.name);
			template.querySelector('p[product-name]').innerText = product.name;

			if (product.off !== '') {
				template.querySelector('p[product-old-price]').innerText = convertToMoneyFormat(product.price);
				template.querySelector('p[product-price]').innerText = convertToMoneyFormat((Number(product.price) / 100) * (100 - Number(product.off)));
			} else {
				template.querySelector('p[product-price]').innerText = convertToMoneyFormat(product.price);
			}

			template.querySelector('p[product-installment]').innerText = product.installment;
			template.querySelector('[product-link]').setAttribute('href', '/api/product/order/' + product.id);

			templateParent.append(template);

			template.style.height = template.offsetHeight + "px"
		})
	})

	_localStorage.forEach(id => {
		if (!allProductIds.includes(id)) {
			_localStorage.splice(_localStorage.indexOf(id, 1))
		}
	})

	localStorage.setItem("saved", JSON.stringify(_localStorage))
}

function buildCategoriesAsideMenu(products) {
	const templateParent = window.document.querySelector("ul[categories-list]")

	Object.keys(products).forEach((key, index) => {
		const template = templateParent.querySelector("template").cloneNode(true).content.children[0]

		template.querySelector("button").addEventListener("click", () => {
			const productSliderContainer = window.document.querySelectorAll('[product-slider-container]')[index];

			scrollTop(productSliderContainer);

			window.document.querySelector("aside[categories-aside-menu]").classList.remove("--on")
		})

		template.querySelector("i[category-name]").innerText = key

		templateParent.append(template)
	})
}

function buildPropagandas(propagandas, footer) {
	const templateParent = window.document.querySelector('div[propagandas-container]');

	if (templateParent.children.length !== 1) {
		return;
	}

	window.document.querySelector('p[store-info]').innerText = footer.storeInfo;

	propagandas.forEach((propaganda) => {
		const template = templateParent.querySelector('template').cloneNode(true).content.children[0];

		template.querySelector('source[big-image]').setAttribute('srcset', propaganda.bigImage);
		template.querySelector('img[small-image]').setAttribute('src', propaganda.smallImage);

		templateParent.append(template);
	});

	setImageSlider();
}

function buildProducts(products) {
	const template1Parent = window.document.querySelector('div[product-section-container]');

	const keys = Object.keys(products);
	let middleKey = -1;

	if (keys.length > 2) {
		middleKey = Math.floor(keys.length / 2);
	}

	keys.forEach((key, index) => {
		const template1 = template1Parent.querySelector('template').cloneNode(true).content.children[0];
		const template2Parent = template1.querySelector('[products-container]');

		if (index === middleKey) {
			template1.classList.add('--on');
		}

		template1.querySelector('h1[category]').innerText = key;

		products[key].forEach((product) => {
			const template2 = template2Parent.querySelector('template').cloneNode(true).content.children[0];

			template2.setAttribute('product-' + product.id, '');

			template2.querySelector("button[add-to-cart-button]").addEventListener("click", () => {
				const _localStorage = JSON.parse(localStorage.getItem("saved"))

				for (let c = 0; c < _localStorage.length; c++) {
					if (_localStorage[c] === product.id) {
						window.document.querySelector("aside[cart-aside-menu]").classList.add("--on")

						return
					}
				}

				_localStorage.push(product.id)

				localStorage.setItem("saved", JSON.stringify(_localStorage))

				buildCartAsideMenu(products)

				window.document.querySelector("aside[cart-aside-menu]").classList.add("--on")
			})

			template2.querySelector('img[product-image]').setAttribute('src', product.image);
			template2.querySelector('img[product-image]').setAttribute('alt', product.name);
			template2.querySelector('p[product-name]').innerText = product.name;

			if (product.off !== '') {
				template2.querySelector('p[product-old-price]').innerText = convertToMoneyFormat(product.price);
				template2.querySelector('p[product-price]').innerText = convertToMoneyFormat((Number(product.price) / 100) * (100 - Number(product.off)));
			} else {
				template2.querySelector('p[product-price]').innerText = convertToMoneyFormat(product.price);
			}

			template2.querySelector('p[product-installment]').innerText = product.installment;
			template2.querySelector('[product-link]').setAttribute('href', '/api/product/order/' + product.id);
			template2Parent.append(template2);
		});

		template1Parent.append(template1);
	});

	setProductSlider();
}

function buildSearchBar(products) {
	window.document.querySelectorAll('div[search-container]').forEach((element) => {
		element.querySelectorAll('input').forEach((input) => {
			input.addEventListener('input', (e) => {
				element.querySelectorAll('div[search-results] button').forEach((element) => element.remove());

				const value = e.target.value;

				const templateParent = element.querySelector('div[search-results]');

				let numberOfSelectedProducts = 0;

				const keys = Object.keys(products);

				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					const productsForKey = products[key];

					for (let j = 0; j < productsForKey.length; j++) {
						const product = productsForKey[j];
						const formattedValue = value
							.toLowerCase()
							.replace(/ /g, '')
							.normalize('NFD')
							.replace(/[\u0300-\u036f]/g, '');
							
						const formattedProductName = product.name
							.toLowerCase()
							.replace(/ /g, '')
							.normalize('NFD')
							.replace(/[\u0300-\u036f]/g, '');

						if (!formattedProductName.includes(formattedValue)) {
							continue;
						}

						numberOfSelectedProducts++;

						if (numberOfSelectedProducts > 4) {
							break;
						}

						const template = templateParent.querySelector('template').cloneNode(true).content.children[0];

						template.querySelector('img[product-image]').setAttribute('src', product.image);
						template.querySelector('img[product-image]').setAttribute('alt', product.name);
						template.querySelector('p[product-name]').innerText = product.name;

						if (product.off !== '') {
							template.querySelector('p[product-price]').innerText = convertToMoneyFormat((Number(product.price) / 100) * (100 - Number(product.off)));
						} else {
							template.querySelector('p[product-price]').innerText = convertToMoneyFormat(product.price);
						}

						template.addEventListener('click', () => {
							setTimeout(() => {
								sliderController[i] = false;

								const productSliderContainer = window.document.querySelectorAll('[product-slider-container]')[i];

								scrollTop(productSliderContainer);

								setTimeout(() => {
									scrollLeft(productSliderContainer, window.document.querySelector('[product-' + product.id + ']'));
								}, 1200);
							}, 120);
						});

						templateParent.append(template);
					}
				}

				if (numberOfSelectedProducts > 0) {
					element.classList.add('--on');
					input.classList.remove('--none');
				} else {
					element.classList.remove('--on');
					input.classList.add('--none');
				}
			});

			element.querySelector('input').addEventListener('focusout', () => {
				setTimeout(() => {
					element.querySelectorAll('div[search-results] button').forEach((element) => element.remove());
					element.classList.remove('--on');
				}, 120);
			});
		});
	});
}

function buildFooter(footer) {
	window.document.querySelector("h1[footer-title]").innerText = footer.title
	window.document.querySelector("p[title-text]").innerText = footer.text
	window.document.querySelector("a[whatsapp-link]").setAttribute("href", footer.whatsapp)
	window.document.querySelector("a[instagram-link]").setAttribute("href", footer.instagram)
	window.document.querySelector("a[facebook-link]").setAttribute("href", footer.facebook)
	window.document.querySelector("p[complete-store-info]").innerText = footer.completeStoreInfo
}