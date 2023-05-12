const browserLanguage = navigator.language;

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
	const template1Parent = window.document.querySelector("div[product-section-container]")

	Object.keys(products).forEach((key) => {
		const template1 = template1Parent.querySelector("template").cloneNode(true).content.children[0]
		const template2Parent = template1.querySelector("[products-container]")

		template1.querySelector("h1[category]").innerText = key

		products[key].forEach((product) => {
			const template2 = template2Parent.querySelector("template").cloneNode(true).content.children[0]

			template2.querySelector("[product-image]").setAttribute("src", product.image)
			template2.querySelector("[product-image]").setAttribute("alt", product.name)
			template2.querySelector("[product-name]").innerText = product.name
			
			if (product.off !== "") {
				template2.querySelector("[product-old-price]").innerText =  convertToMoneyFormat(product.price)
				template2.querySelector("[product-price]").innerText =  convertToMoneyFormat(Number(product.price) / 100 * (100 - Number(product.off)))
			} else {
				template2.querySelector("[product-price]").innerText = convertToMoneyFormat(product.price)
			}

			template2.querySelector("[product-installment]").innerText = product.installment

			template2Parent.append(template2)
		})

		template1Parent.append(template1)
	})

	setProductSlider()
}

function setImageSlider() {
	const imageSliderContainer = window.document.querySelector('div[image-slider-container]')
	const imageSlider = imageSliderContainer.querySelector('div');
	const numberOfPropagandas = imageSliderContainer.querySelectorAll('img[small-image]').length;
	let currentIndex = 0;
	let goingLeft = true;
	let isMoving = false

	setInterval(() => {
		if (isMoving) {
			isMoving = false
			return
		}

		if (goingLeft) {
			slideToNextImage()
		} else {
			slideToPrevImage()
		}
	}, 10000);

	let event = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "touchstart" : "mousedown"

	imageSliderContainer.querySelector("button:first-of-type").addEventListener(event, () => slideToPrevImage())
	imageSliderContainer.querySelector("button:last-of-type").addEventListener(event, () => slideToNextImage())

	function slideToPrevImage() {
		isMoving = true
		currentIndex --

		imageSlider.scrollTo({
			left: (imageSlider.scrollWidth / numberOfPropagandas) * currentIndex,
			top: 0,
			behavior: 'smooth',
		});

		if (currentIndex <= 0) {
			currentIndex = 0
			goingLeft = true;
		}
	}

	function slideToNextImage() {
		isMoving = true
		currentIndex ++

		imageSlider.scrollTo({
			left: (imageSlider.scrollWidth / numberOfPropagandas) * currentIndex,
			top: 0,
			behavior: 'smooth',
		});

		if ((currentIndex + 1) >= numberOfPropagandas) {
			currentIndex = numberOfPropagandas - 1
			goingLeft = false;
		}	
	}
}

const sliderController = []
function setProductSlider() {
	window.document.querySelectorAll("[product-slider-container]").forEach((element, index) => {
		sliderController.push(true);
		let isDown = false;
		let startX;
		let position;
		let left;
		let scrollLeft;
		let sliderControllerSetted = false;
		setInterval(() => {
			if (!isDown && sliderController[index]) {
				if (sliderControllerSetted) {
					sliderControllerSetted = false;
				}
				if (position >= element.scrollWidth - element.clientWidth) left = false;
				if (position <= 1) left = true;

				if (left) position = element.scrollLeft + 1;
				else position = element.scrollLeft - 1;

				element.scrollTo(position, 0);
			}
			if (!sliderControllerSetted && !sliderController[index]) {
				sliderControllerSetted = true;
				setTimeout(() => {
					sliderController[index] = true;
				}, 5000);
			}
		}, 10);
		element.addEventListener("touchmove", () => {
			isDown = true;
		});
		element.addEventListener("touchend", () => {
			isDown = false;
		});
		element.addEventListener("mousedown", (e) => {
			isDown = true;
			element.classList.add("active");
			startX = e.pageX - element.offsetLeft;
			scrollLeft = element.scrollLeft;
		});
		element.addEventListener("mouseleave", () => {
			isDown = false;
			element.classList.remove("active");
		});
		element.addEventListener("mouseup", () => {
			isDown = false;
			element.classList.remove("active");
		});
		element.addEventListener("mousemove", (e) => {
			if (!isDown) return;
			e.preventDefault();
			const x = e.pageX - element.offsetLeft;
			const walk = x - startX;
			element.scrollLeft = scrollLeft - walk;
			position = element.scrollLeft;
		});
	});

	window.document.querySelectorAll("[card-slider] [real]").forEach((element) => {
		element.innerText = formatarReal(Number(element.innerText));
	});

	window.document.querySelectorAll("[add-to-cart-button]").forEach(element => {
		element.addEventListener("click", () => {
			addToCart(element.getAttribute("for"))
		})
	})
}

function convertToMoneyFormat(number) {
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}