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

export function renderSavedProducts(products) {
	let saved = localStorage.getItem('saved');

	if (!saved) {
		localStorage.setItem('saved', '[]');
		saved = localStorage.getItem('saved');
	}

	const savedIds = JSON.parse(saved);
	const templateParent = document.querySelector('div[saved-product-container]');

	templateParent.querySelectorAll('div').forEach((element) => {
		element.remove();
	});

	Object.values(products).forEach((productsForKey) => {
		productsForKey.forEach((product) => {
			if (!savedIds.includes(String(product.id))) {
				return;
			}

			const template = templateParent
				.querySelector('template')
				.content.firstElementChild.cloneNode(true);
			const removeFromCartButton = template.querySelector(
				'button[remove-from-saved-button]',
			);
			const productImage = template.querySelector('img[product-image]');
			const productName = template.querySelector('p[product-name]');
			const productPrice = template.querySelector('p[product-price]');
			const productInstallment = template.querySelector(
				'p[product-installment]',
			);
			const productLink = template.querySelector('a[product-link]');

			removeFromCartButton.addEventListener('click', () => {
				template.classList.add('--off');
				template.style.height = '0px';

				setTimeout(() => {
					const updatedSavedIds = JSON.parse(localStorage.getItem('saved'));
					updatedSavedIds.splice(updatedSavedIds.indexOf(product.id), 1);
					localStorage.setItem('saved', JSON.stringify(updatedSavedIds));

					renderSavedProducts(products);
				}, 350);
			});

			productImage.src = product.image;
			productImage.alt = product.name;
			productName.textContent = product.name;

			if (product.off === 0) {
				productPrice.textContent = convertToMoneyFormat(product.price);
			} else {
				productPrice.textContent = convertToMoneyFormat(
					(Number(product.price) / 100) * (100 - Number(product.off)),
				);
				const oldPriceElement = template.querySelector('p[product-old-price]');
				oldPriceElement.textContent = convertToMoneyFormat(product.price);
			}

			productInstallment.textContent = product.installment;
			productLink.href = '/order/' + product.id;

			templateParent.append(template);
			template.style.height = template.offsetHeight + 21 + 'px';
		});
	});
}

export function handleProductsGrid(element) {
	if (
		element.scrollWidth - element.clientWidth <
			Number(window.getComputedStyle(element).paddingLeft.replace('px', '')) +
				280 &&
		!element.classList.contains('--special')
	) {
		element.classList.add('--special');

		if (element.children.length % 2 !== 0) {
			element.style.gridTemplateColumns = '1fr 1fr 1fr';

			if (element.children.length > 4) {
				element.children[element.children.length - 1].classList.add(
					'--special',
				);
			}
		}
	}
}

export function handlePropagandaScroll(controller, forward) {
	forward ? controller.currentIndex++ : controller.currentIndex--;

	controller.imageSlider.scrollTo({
		left:
			(controller.imageSlider.scrollWidth / controller.numberOfPropagandas) *
			controller.currentIndex,
		top: 0,
		behavior: 'smooth',
	});

	if (controller.currentIndex + 1 >= controller.numberOfPropagandas) {
		controller.currentIndex = controller.numberOfPropagandas - 1;
		controller.goingLeft = false;
	}

	if (controller.currentIndex <= 0) {
		controller.currentIndex = 0;
		controller.goingLeft = true;
	}
}

export function convertToMoneyFormat(number) {
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function scrollTop(element) {
	window.scrollTo({
		left: 0,
		top:
			getOffset(element).top -
			window.innerHeight / 2 +
			element.offsetHeight / 2 +
			(window.innerWidth <= 870 ? -50 : 0),
		behavior: 'smooth',
	});

	function getOffset(element) {
		return {
			left: 0,
			top: element.getBoundingClientRect().top + window.scrollY,
		};
	}
}

export function scrollLeft(container, element) {
	if (container.scrollLeft === 0) {
		return;
	}

	const left =
		element.getBoundingClientRect().left +
		container.scrollLeft -
		window.innerWidth / 2 +
		element.offsetWidth / 2;

	console.log(left);

	container.scrollTo({
		left,
		top: 0,
		behavior: 'smooth',
	});
}
