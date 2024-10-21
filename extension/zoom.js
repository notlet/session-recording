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
};

if (window.location.href.includes('zoom.us/j/')) {
	window.location.href = window.location.href.replace('/j/', '/wc/join/');
}

const joinAudio = async b => {
	await sleep(2000);
	b.click();

	 // Click on the screen to discard any popups
	await sleep(5000);
	setInterval(() => document.querySelector('div#sharee-container')?.click(), 5000);
}

(async () => {
	console.log('AutoMeetings active, waiting for elements to load...')

	// Wait for elements to appear and then click them
	waitForElm('button#preview-audio-control-button[aria-label="Join Audio"]').then(joinAudio); // join audio in name input screen or waiting room
	waitForElm('button.join-audio-container__btn[aria-label="join audio"]').then(joinAudio); // join audio in meeting
	waitForElm('button.join-audio-by-voip__join-btn').then((b) => b.click()); // confirm join audio in meeting
	waitForElm('div.disclaimer-content:has(div[title="This meeting is being recorded"]) button.ok-button').then((b) => b.click()); // discard recording disclaimer

	// Wait for name input and set it
	waitForElm('input#input-for-name').then(async (nameInput) => {
		console.log('Found name input.');
		nameInput.value = 'Session Recorder';
		nameInput.dispatchEvent(new Event('input', { bubbles: true })); // trigger input update
		console.log('Set name.');

		const joinBtn = document.querySelector('button.preview-join-button');
		await addTimer(joinBtn, 5);
		joinBtn.click();
	});
})();