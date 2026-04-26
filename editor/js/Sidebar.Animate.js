import { UIPanel, UIText, UIButton } from './libs/ui.js';

function SidebarAnimate( editor ) {

	const container = new UIPanel();
	container.setDisplay('none');

	const title = new UIText('Animation Panel');
	container.add(title);

	const playBtn = new UIButton('Play').onClick(() => {

		const object = editor.selected;

		if (object && object.isMesh) {
			console.log('Play animation:', object.name);
		}

	});

	container.add(playBtn);

	editor.signals.objectSelected.add(function (object) {

		if (object && object.isMesh) {
			container.setDisplay('');
		} else {
			container.setDisplay('none');
		}

	});

	return container;

}

export { SidebarAnimate };
