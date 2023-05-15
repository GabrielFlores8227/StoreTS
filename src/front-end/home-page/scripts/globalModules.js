function showLoadingScreenLogo() {
	window.document.querySelector('div[loading-screen-container] img').classList.add('--on');
}

function removeLoadingScreen() {
	setTimeout(() => {
		window.document.querySelector('div[loading-screen-container]').classList.add('--off');
	}, 2800);
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

	buildCategoriesAsideMenu(products)
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

function setImageSlider() {
	const imageSliderContainer = window.document.querySelector('div[image-slider-container]');
	const imageSlider = imageSliderContainer.querySelector('div');
	const numberOfPropagandas = imageSliderContainer.querySelectorAll('img[small-image]').length;
	let currentIndex = 0;
	let goingLeft = true;
	let isMoving = false;

	setInterval(() => {
		if (isMoving) {
			isMoving = false;
			return;
		}

		if (goingLeft) {
			slideToNextImage();
		} else {
			slideToPrevImage();
		}
	}, 10000);

	let event = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'touchstart' : 'mousedown';

	imageSliderContainer.querySelector('button:first-of-type').addEventListener(event, () => slideToPrevImage());
	imageSliderContainer.querySelector('button:last-of-type').addEventListener(event, () => slideToNextImage());

	function slideToPrevImage() {
		isMoving = true;
		currentIndex--;

		imageSlider.scrollTo({
			left: (imageSlider.scrollWidth / numberOfPropagandas) * currentIndex,
			top: 0,
			behavior: 'smooth',
		});

		if (currentIndex <= 0) {
			currentIndex = 0;
			goingLeft = true;
		}
	}

	function slideToNextImage() {
		isMoving = true;
		currentIndex++;

		imageSlider.scrollTo({
			left: (imageSlider.scrollWidth / numberOfPropagandas) * currentIndex,
			top: 0,
			behavior: 'smooth',
		});

		if (currentIndex + 1 >= numberOfPropagandas) {
			currentIndex = numberOfPropagandas - 1;
			goingLeft = false;
		}
	}
}

const sliderController = [];
function setProductSlider() {
	window.document.querySelectorAll('[product-slider-container]').forEach((element, index) => {
		sliderController.push(true);
		let isDown = false;
		let startX;
		let position;
		let left;
		let scrollLeft;
		let sliderControllerSetted = false;

		setInterval(() => {
			if (element.scrollWidth - element.clientWidth < 80) {
				return;
			}

			if (isDown) {
				sliderController[index] = false;
			}

			if (sliderController[index]) {
				if (sliderControllerSetted) {
					sliderControllerSetted = false;
				}
				if (position >= element.scrollWidth - element.clientWidth) left = false;
				if (position <= 1) left = true;

				if (left) position = element.scrollLeft + 1;
				else position = element.scrollLeft - 1;

				element.scrollTo(position, 0);
			}

			if (!sliderController[index] && !sliderControllerSetted) {
				sliderControllerSetted = true;
				setTimeout(() => {
					sliderController[index] = true;
				}, 5000);
			}
		}, 14);

		element.addEventListener('touchmove', () => {
			isDown = true;
		});
		element.addEventListener('touchend', () => {
			isDown = false;
		});
		element.addEventListener('mousedown', (e) => {
			isDown = true;
			element.classList.add('active');
			startX = e.pageX - element.offsetLeft;
			scrollLeft = element.scrollLeft;
		});
		element.addEventListener('mouseleave', () => {
			isDown = false;
			element.classList.remove('active');
		});
		element.addEventListener('mouseup', () => {
			isDown = false;
			element.classList.remove('active');
		});
		element.addEventListener('mousemove', (e) => {
			if (!isDown) return;
			e.preventDefault();
			const x = e.pageX - element.offsetLeft;
			const walk = x - startX;
			element.scrollLeft = scrollLeft - walk;
			position = element.scrollLeft;
		});
	});

	window.document.querySelectorAll('[card-slider] [real]').forEach((element) => {
		element.innerText = formatarReal(Number(element.innerText));
	});

	window.document.querySelectorAll('[add-to-cart-button]').forEach((element) => {
		element.addEventListener('click', () => {
			addToCart(element.getAttribute('for'));
		});
	});
}

function convertToMoneyFormat(number) {
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function scrollTop(element) {
	window.scrollTo({
		left: 0,
		top: getOffset(element).top - (window.innerWidth >= 700 ? 161 : 224),
		behavior: 'smooth',
	});

	function getOffset(element) {
		return {
			left: element.getBoundingClientRect().left + window.scrollX,
			top: element.getBoundingClientRect().top + window.scrollY,
		};
	}
}

function scrollLeft(container, element) {
	container.scrollTo({
		left: element.getBoundingClientRect().left + container.scrollLeft - (window.innerWidth >= 700 ? 294 : 42),
		top: 0,
		behavior: 'smooth',
	});
}
