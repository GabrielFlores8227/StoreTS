import {
	buildAsideMenus,
	renderSavedProducts,
	handleProductsGrid,
	handlePropagandaScroll,
	convertToMoneyFormat,
	scrollTop,
	scrollLeft,
} from './modules.js';

const sliderController = [];

(() => {
	const sliders = window.document.querySelectorAll(
		'div[product-slider-container]',
	);

	sliders.forEach((element, index) => {
		sliderController.push(true);

		let isDown = false;
		let startX;
		let position;
		let left;
		let scrollLeft;
		let sliderControllerSetted = false;

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

		setInterval(() => {
			handleProductsGrid(element);

			if (isDown) {
				sliderController[index] = false;
			}

			if (sliderController[index]) {
				if (sliderControllerSetted) {
					sliderControllerSetted = false;
				}

				if (position >= element.scrollWidth - element.clientWidth) {
					left = false;
				}

				if (position <= 1) {
					left = true;
				}

				if (element.scrollWidth - element.clientWidth > 100) {
					if (left) {
						position = element.scrollLeft + 1;
					} else {
						position = element.scrollLeft - 1;
					}
				}

				element.scrollTo({
					left: position,
					top: 0,
				});
			}

			if (!sliderController[index] && !sliderControllerSetted) {
				sliderControllerSetted = true;

				setTimeout(() => {
					sliderController[index] = true;
				}, 10000);
			}
		}, 14);
	});

	window.addEventListener('resize', () => {
		sliders.forEach((element) => {
			element.classList.remove('--special');

			handleProductsGrid(element);
		});
	});
})();

(() => {
	const { products } = builder;

	const formatString = (str) =>
		str
			.toLowerCase()
			.replace(/ /g, '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');

	document
		.querySelectorAll('div[search-container]')
		.forEach((searchContainer) => {
			const input = searchContainer.querySelector('input');
			const templateParent = searchContainer.querySelector(
				'div[search-results]',
			);

			input.addEventListener('input', (event) => {
				const value = formatString(event.target.value);
				const template = templateParent.querySelector('template');
				let numberOfSelectedProducts = 0;

				templateParent.querySelectorAll('button').forEach((element) => {
					element.remove();
				});

				Object.values(products).forEach((productsForKey, i) => {
					productsForKey.forEach((product) => {
						const formattedProductName = formatString(product.name);

						if (!formattedProductName.includes(value)) {
							return;
						}

						numberOfSelectedProducts++;

						if (numberOfSelectedProducts > 4) {
							return;
						}

						const clone = template.cloneNode(true).content.children[0];
						const templateImg = clone.querySelector('img[product-image]');
						const templateName = clone.querySelector('p[product-name]');
						const templatePrice = clone.querySelector('p[product-price]');

						templateImg.src = product.image;
						templateImg.alt = product.name;
						templateName.innerText = product.name;

						if (product.off !== '') {
							templatePrice.innerText = convertToMoneyFormat(
								(Number(product.price) / 100) * (100 - Number(product.off)),
							);
						} else {
							templatePrice.innerText = convertToMoneyFormat(product.price);
						}

						clone.addEventListener('mousedown', () => {
							setTimeout(() => {
								sliderController[i] = false;

								const productSliderContainer = document.querySelectorAll(
									'[product-slider-container]',
								)[i];
								const productCard = document.querySelector(
									`[product-id="${product.id}"]`,
								);

								scrollTop(productCard);

								setTimeout(() => {
									scrollLeft(productSliderContainer, productCard);
								}, 2000);
							}, 120);
						});

						templateParent.appendChild(clone);
					});
				});

				searchContainer.classList.toggle('--on', numberOfSelectedProducts > 0);
				input.classList.toggle('--none', numberOfSelectedProducts === 0);
			});

			input.addEventListener('focusout', () => {
				setTimeout(() => {
					templateParent.querySelectorAll('button').forEach((element) => {
						element.remove();
					});

					searchContainer.classList.remove('--on');
				}, 120);
			});
		});
})();

(() => {
	buildAsideMenus([
		{
			selector: 'open-saved-aside-menu-button',
			element: document.querySelector('aside[saved-aside-menu]'),
			action: 'add',
		},
		{
			selector: 'close-saved-aside-menu-button',
			element: document.querySelector('aside[saved-aside-menu]'),
			action: 'remove',
		},
		{
			selector: 'open-categories-aside-menu-button',
			element: document.querySelector('aside[categories-aside-menu]'),
			action: 'add',
		},
		{
			selector: 'close-categories-aside-menu-button',
			element: document.querySelector('aside[categories-aside-menu]'),
			action: 'remove',
		},
	]);

	window.document
		.querySelectorAll('button[go-to-section-button]')
		.forEach((button, index) => {
			button.addEventListener('click', () => {
				setTimeout(() => {
					scrollTop(
						window.document.querySelectorAll('div[product-slider-container]')[
							index
						],
					);
				}, 120);
			});
		});

	renderSavedProducts(builder.products);
})();

(() => {
	const productSections = window.document.querySelectorAll(
		'div[product-section]',
	);

	if (productSections.length > 2) {
		productSections[Math.floor(productSections.length / 2)].classList.add(
			'--special',
		);
	}

	window.document.querySelectorAll('p[price]').forEach((p) => {
		p.innerText = convertToMoneyFormat(Number(p.innerText));
	});

	window.document.querySelectorAll('div[product-container]').forEach((div) => {
		div
			.querySelector('button[save-product-button]')
			.addEventListener('click', () => {
				setTimeout(() => {
					const savedIds = JSON.parse(localStorage.getItem('saved'));
					savedIds.push(div.getAttribute('product-id'));
					localStorage.setItem('saved', JSON.stringify(savedIds));

					renderSavedProducts(builder.products);
				}, 120);
			});
	});
})();

(() => {
	const controller = {
		imageSliderContainer: window.document.querySelector(
			'div[image-slider-container]',
		),
		imageSlider: window.document.querySelector(
			'div[image-slider-container] div',
		),
		numberOfPropagandas: window.document.querySelectorAll(
			'div[image-slider-container] img',
		).length,
		currentIndex: 0,
		goingLeft: true,
	};

	setInterval(() => {
		if (controller.goingLeft) {
			handlePropagandaScroll(controller, true);
		} else {
			handlePropagandaScroll(controller, false);
		}
	}, 10000);

	const event = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
		? 'touchstart'
		: 'mousedown';

	controller.imageSliderContainer
		.querySelector('button:first-of-type')
		.addEventListener(event, () => {
			handlePropagandaScroll(controller, false);
		});

	controller.imageSliderContainer
		.querySelector('button:last-of-type')
		.addEventListener(event, () => {
			handlePropagandaScroll(controller, true);
		});

	window.addEventListener('resize', () => {
		controller.imageSlider.scrollLeft =
			(controller.imageSlider.scrollWidth / controller.numberOfPropagandas) *
			controller.currentIndex;
	});
})();
