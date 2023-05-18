(async () => {
     const header = await (await fetch('/api/header')).json();

	buildLogo(header.logo);
	buildHead(header);
})()