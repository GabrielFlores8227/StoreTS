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

	buildImageSlider();
}

function buildImageSlider() {
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
