import { UIPanel, UIRow, UIText, UIButton, UINumber } from './libs/ui.js';

function SidebarAnimate(editor) {

	const container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay('none');

	let currentObject = null;
	let draggingIndex = null;

	const title = new UIText('動畫編輯器');
	container.add(title);

	const frameList = new UIPanel();
	container.add(frameList);

	// ======================
	// UI 更新
	// ======================
	function updateUI() {

		frameList.clear();

		if (!currentObject) return;

		if (!currentObject.userData.timeline) {
			currentObject.userData.timeline = { loop: true, frames: [] };
		}

		const timeline = currentObject.userData.timeline;
		const frames = timeline.frames;

		// 🔥 固定時間（1秒一格）
		frames.forEach((f, i) => f.t = i);

		frames.forEach((frame, index) => {

			const row = new UIRow();

			row.dom.style.border = '1px solid #444';
			row.dom.style.marginBottom = '4px';
			row.dom.style.padding = '2px';
			row.dom.style.display = 'flex';
			row.dom.style.alignItems = 'center';

			// ======================
			// 🔥 拖曳把手（重點）
			// ======================
			const dragHandle = new UIText('≡');
			dragHandle.setWidth('20px');

			dragHandle.dom.style.cursor = 'grab';
			dragHandle.dom.style.userSelect = 'none';
			dragHandle.dom.style.touchAction = 'none';

			dragHandle.dom.addEventListener('pointerdown', () => {
				draggingIndex = index;
				dragHandle.dom.style.opacity = '0.5';
			});

			dragHandle.dom.addEventListener('pointerup', (e) => {

				if (draggingIndex === null) return;

				const elements = frameList.dom.children;
				let targetIndex = index;

				for (let i = 0; i < elements.length; i++) {

					const rect = elements[i].getBoundingClientRect();

					if (e.clientY < rect.top + rect.height / 2) {
						targetIndex = i;
						break;
					}

				}

				const temp = frames[draggingIndex];
				frames[draggingIndex] = frames[targetIndex];
				frames[targetIndex] = temp;

				draggingIndex = null;
				updateUI();

			});

			// ===== index =====
			const label = new UIText(`秒 ${index}`).setWidth('60px');

			// ===== position =====
			const px = new UINumber(frame.pos?.[0] || 0).setWidth('40px');
			const py = new UINumber(frame.pos?.[1] || 0).setWidth('40px');
			const pz = new UINumber(frame.pos?.[2] || 0).setWidth('40px');

			function syncPos() {
				frame.pos = [
					px.getValue(),
					py.getValue(),
					pz.getValue()
				];
			}

			px.onChange(syncPos);
			py.onChange(syncPos);
			pz.onChange(syncPos);

			// ===== delete =====
			const del = new UIButton('刪');
			del.onClick(() => {
				frames.splice(index, 1);
				updateUI();
			});

			row.add(dragHandle, label, px, py, pz, del);

			frameList.add(row);

		});

	}

	// ======================
	// 新增 frame
	// ======================
	const addBtn = new UIButton('新增一秒').onClick(() => {

		if (!currentObject) return;

		const frames = currentObject.userData.timeline.frames;

		frames.push({
			t: frames.length,
			pos: [0, 0, 0],
			rot: [0, 0, 0]
		});

		updateUI();

	});

	container.add(addBtn);

	// ======================
	// 播放
	// ======================
	let playing = false;
	let startTime = 0;

	const playBtn = new UIButton('播放').onClick(() => {
		playing = !playing;
		startTime = performance.now();
	});

	container.add(playBtn);

	// ======================
	// 動畫套用
	// ======================
	function applyTimeline(object, time) {

		const timeline = object.userData.timeline;
		if (!timeline || timeline.frames.length < 2) return;

		const frames = timeline.frames;

		let f1 = frames[0];
		let f2 = frames[frames.length - 1];

		for (let i = 0; i < frames.length - 1; i++) {

			if (time >= frames[i].t && time <= frames[i + 1].t) {
				f1 = frames[i];
				f2 = frames[i + 1];
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

	}

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	// ======================
	// signals
	// ======================
	editor.signals.objectSelected.add((object) => {

		if (object && object.isMesh) {
			currentObject = object;
			container.setDisplay('');
			updateUI();
		} else {
			currentObject = null;
			container.setDisplay('none');
		}

	});

	editor.signals.rendererUpdated.add(() => {

		if (!playing || !currentObject) return;

		const t = (performance.now() - startTime) / 1000;

		applyTimeline(currentObject, t);

	});

	return container;
}

export { SidebarAnimate };
