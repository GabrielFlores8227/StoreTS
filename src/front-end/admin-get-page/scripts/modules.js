// This function checks the URL for a query parameter named 'message'.
// If the 'message' parameter exists, it retrieves its value and updates the corresponding element in the DOM.
// The element is identified using a query selector and the retrieved message is set as its inner text.
// Finally, the function adds a CSS class to the element to show it by applying the '--on' modifier class.
function checkUrl() {
	const message = new URLSearchParams(window.location.search).get('message');

	if (message) {
		const element = window.document.querySelector('span[message-container]');

		element.querySelector('i[message]').innerText = message;
		element.classList.add('--not-ok');
	}
}
