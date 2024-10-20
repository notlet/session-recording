const waitForElm = (s) => new Promise(resolve => {
	if (document.querySelector(s)) return resolve(document.querySelector(s));
	
	const observer = new MutationObserver(() => {
		if (document.querySelector(s)) {
			observer.disconnect();
			resolve(document.querySelector(s));
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const addTimer = async(element, seconds) => {
	const text = element.innerText;
	for (let t = seconds; t >= 0; t--) {
		element.innerText = `${text} (${t})`;
		await sleep(1000);
	}
	await sleep(100); // additional 100ms timeout to avoid bugs
};

window.addEventListener('load', async () => {
	console.log('Waiting for name input to load.');

	const nameInput = await waitForElm('input#input-for-name');
	nameInput.value = 'Session Recorder';
	nameInput.dispatchEvent(new Event('input', { bubbles: true }));
	console.log('Set name.');

	const joinBtn = document.querySelector('button.preview-join-button');
	await addTimer(joinBtn, 5);
	joinBtn.click();
});

window.addEventListener('load', async () => {
	console.log('Waiting for join audio button to load.');
	
	const button = await waitForElm('button.join-audio-by-voip__join-btn');
	await addTimer(button, 3);
	button.click();
	console.log('Joined audio.');
});