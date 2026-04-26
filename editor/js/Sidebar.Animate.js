import { UIPanel, UIRow, UIText, UIButton, UINumber } from './libs/ui.js';

function SidebarAnimate( editor ) {

	const container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay('none');

	let currentObject = null;

	const title = new UIText('Animation Timeline');
	container.add(title);

	const timelineContainer = new UIPanel();
	container.add(timelineContainer);

	// ➕ 新增 frame
	const addFrameBtn = new UIButton('Add Frame').onClick(() => {

		if (!currentObject) return;

		if (!currentObject.userData.timeline) {
			currentObject.userData.timeline = { loop: true, frames: [] };
		}

		currentObject.userData.timeline.frames.push({
			t: 0,
			pos: [0,0,0],
			rot: [0,0,0]
		});

		updateUI();

	});

	container.add(addFrameBtn);

	// 🔄 UI刷新
	function updateUI() {

		timelineContainer.clear();

		if (!currentObject) return;

		const timeline = currentObject.userData.timeline || { frames: [] };

		timeline.frames.forEach((frame, index) => {

			const row = new UIRow();

			const label = new UIText(`F${index}`);
			const time = new UINumber(frame.t).setWidth('40px').onChange(() => {
				frame.t = time.getValue();
			});

			const posX = new UINumber(frame.pos?.[0] || 0).setWidth('40px').onChange(() => {
				frame.pos = frame.pos || [0,0,0];
				frame.pos[0] = posX.getValue();
			});

			const posY = new UINumber(frame.pos?.[1] || 0).setWidth('40px').onChange(() => {
				frame.pos[1] = posY.getValue();
			});

			const posZ = new UINumber(frame.pos?.[2] || 0).setWidth('40px').onChange(() => {
				frame.pos[2] = posZ.getValue();
			});

			row.add(label, time, posX, posY, posZ);

			timelineContainer.add(row);

		});

	}

	// ▶ 播放控制
	let playing = false;
	let startTime = 0;

	const playBtn = new UIButton('Play / Pause').onClick(() => {

		if (!currentObject) return;

		playing = !playing;
		startTime = performance.now();

	});

	container.add(playBtn);

	// 📡 接收選取事件
	editor.signals.objectSelected.add(function (object) {

		if (object && object.isMesh) {

			currentObject = object;
			container.setDisplay('');
			updateUI();

		} else {

			currentObject = null;
			container.setDisplay('none');

		}

	});

	// 🔥 註冊動畫更新（核心）
	editor.signals.rendererUpdated.add(function () {

		if (!playing || !currentObject) return;

		const t = (performance.now() - startTime) / 1000;

		applyTimeline(currentObject, t);

	});

	// 🎯 timeline 套用
	function applyTimeline(object, time) {

		const timeline = object.userData.timeline;
		if (!timeline || timeline.frames.length < 2) return;

		const frames = timeline.frames;

		let f1 = frames[0];
		let f2 = frames[frames.length - 1];

		for (let i = 0; i < frames.length - 1; i++) {
			if (time >= frames[i].t && time <= frames[i+1].t) {
				f1 = frames[i];
				f2 = frames[i+1];
				break;
			}
		}

		const duration = f2.t - f1.t;
		const alpha = duration === 0 ? 0 : (time - f1.t) / duration;

		if (f1.pos && f2.pos) {
			object.position.set(
				lerp(f1.pos[0], f2.pos[0], alpha),
				lerp(f1.pos[1], f2.pos[1], alpha),
				lerp(f1.pos[2], f2.pos[2], alpha)
			);
		}

		if (f1.rot && f2.rot) {
			object.rotation.set(
				lerp(f1.rot[0], f2.rot[0], alpha),
				lerp(f1.rot[1], f2.rot[1], alpha),
				lerp(f1.rot[2], f2.rot[2], alpha)
			);
		}

	}

	function lerp(a,b,t){
		return a + (b - a) * t;
	}

	return container;

}

export { SidebarAnimate };
