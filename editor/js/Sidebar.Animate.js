import { UIPanel, UIRow, UIText, UIButton, UINumber } from './libs/ui.js';

function SidebarAnimate(editor) {

	const container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay('none');

	let currentObject = null;

	let dragIndex = null;

	const title = new UIText('動畫編輯器');
	container.add(title);

	const frameList = new UIPanel();
	container.add(frameList);

	// ========== UI 重建 ==========
	function updateUI() {

		frameList.clear();
		if (!currentObject) return;

		const timeline = currentObject.userData.timeline || { frames: [] };
		currentObject.userData.timeline = timeline;

		timeline.frames.forEach((frame, index) => {

			const row = new UIRow();
			row.dom.style.cursor = 'grab';
			row.dom.style.userSelect = 'none';

			// === 顯示時間 ===
			const time = new UINumber(frame.t).setWidth('50px');
			time.onChange(() => {
				frame.t = time.getValue();
			});

			// === position ===
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

			// === delete ===
			const del = new UIButton('X');
			del.onClick(() => {
				timeline.frames.splice(index, 1);
				updateUI();
			});

			row.add(
				new UIText(`#${index}`).setWidth('30px'),
				time,
				px, py, pz,
				del
			);

			// ======================
			// DRAG LOGIC（重點）
			// ======================
			row.dom.draggable = true;

			row.dom.addEventListener('dragstart', (e) => {
				dragIndex = index;
				e.dataTransfer.effectAllowed = 'move';
			});

			row.dom.addEventListener('dragover', (e) => {
				e.preventDefault();
			});

			row.dom.addEventListener('drop', (e) => {
				e.preventDefault();

				if (dragIndex === null || dragIndex === index) return;

				const frames = timeline.frames;

				const temp = frames[dragIndex];
				frames[dragIndex] = frames[index];
				frames[index] = temp;

				dragIndex = null;

				updateUI();
			});

			frameList.add(row);

		});

	}

	// ========== add frame ==========
	const addBtn = new UIButton('新增 Frame (1秒)').onClick(() => {

		if (!currentObject) return;

		if (!currentObject.userData.timeline) {
			currentObject.userData.timeline = { frames: [] };
		}

		const frames = currentObject.userData.timeline.frames;

		frames.push({
			t: frames.length,
			pos: [0, 0, 0],
			rot: [0, 0, 0]
		});

		updateUI();

	});

	container.add(addBtn);

	// ========== play ==========
	let playing = false;
	let start = 0;

	const playBtn = new UIButton('Play').onClick(() => {
		playing = !playing;
		start = performance.now();
	});

	container.add(playBtn);

	// ========== apply ==========
	function apply(object, t) {

		const timeline = object.userData.timeline;
		if (!timeline || timeline.frames.length < 2) return;

		const f = timeline.frames;

		let a = f[0], b = f[f.length - 1];

		for (let i = 0; i < f.length - 1; i++) {
			if (t >= f[i].t && t <= f[i + 1].t) {
				a = f[i];
				b = f[i + 1];
				break;
			}
		}

		const u = (t - a.t) / Math.max(0.0001, (b.t - a.t));

		object.position.set(
			lerp(a.pos[0], b.pos[0], u),
			lerp(a.pos[1], b.pos[1], u),
			lerp(a.pos[2], b.pos[2], u)
		);

	}

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	// ========== signals ==========
	editor.signals.objectSelected.add((obj) => {

		if (obj && obj.isMesh) {
			currentObject = obj;
			container.setDisplay('');
			updateUI();
		} else {
			currentObject = null;
			container.setDisplay('none');
		}

	});

	editor.signals.rendererUpdated.add(() => {

		if (!playing || !currentObject) return;

		const t = (performance.now() - start) / 1000;
		apply(currentObject, t);

	});

	return container;
}

export { SidebarAnimate };
