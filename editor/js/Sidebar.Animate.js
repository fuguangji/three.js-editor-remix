import { UIPanel, UIText, UIButton } from './libs/ui.js';

function SidebarAnimate( editor ) {

	const container = new UIPanel();

	const title = new UIText('動畫編輯器');
	container.add(title);

	const playBtn = new UIButton('Play').onClick(() => {

		const object = editor.selected;

		if (object && object.isMesh) {
			console.log('Play animation:', object.name);
		}

	});

	container.add(playBtn);

	return container;

}

export { SidebarAnimate };
