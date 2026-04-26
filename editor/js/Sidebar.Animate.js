import { UIPanel, UIRow, UIText, UIButton, UINumber } from './libs/ui.js';

function SidebarAnimate(editor) {

	const container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay('none');

	let currentObject = null;

	let dragIndex = null;

	const title = new UIText('Frame 動畫編輯器');
	container.add(title);

	const list = new UIPanel();
	container.add(list);

	// -------------------------
	// frames helper
	// -------------------------
	function getFrames(obj) {

		if (!obj.userData.frames) {
			obj.userData.frames = [];
		}

		return obj.userData.frames;

	}

	// -------------------------
	// sort frames
	// -------------------------
	function sortFrames(frames) {

		frames.sort((a, b) => a.t - b.t);

	}

	// -------------------------
	// swap frames
	// -------------------------
	function swap(frames, a, b) {

		const tmp = frames[a];
		frames[a] = frames[b];
		frames[b] = tmp;

	}

	// -------------------------
	// UI render
	// -------------------------
	function updateUI() {

		list.clear();

		if (!currentObject) return;

		const frames = getFrames(currentObject);

		frames.forEach((frame, index) => {

			const row = new UIRow();

			// ===== drag enable =====
			row.dom.draggable = true;

			// ===== drag start =====
			row.dom.addEventListener('dragstart', () => {

				dragIndex = index;

			});

			// ===== allow drop =====
			row.dom.addEventListener('dragover', (e) => {

				e.preventDefault();

			});

			// ===== drop swap =====
			row.dom.addEventListener('drop', () => {

				if (dragIndex === null || dragIndex === index) return;

				swap(frames, dragIndex, index);

				dragIndex = null;

				updateUI();

			});

			// ===== time =====
			const tInput = new UINumber(frame.t)
				.setWidth('60px')
				.setRange(0, 999)
				.onChange(() => {

					frame.t = tInput.getValue();
					sortFrames(frames);
					updateUI();

				});

			// ===== position =====
			const px = new UINumber(frame.pos?.[0] || 0).setWidth('50px').onChange(() => {
				frame.pos = frame.pos || [0, 0, 0];
				frame.pos[0] = px.getValue();
			});

			const py = new UINumber(frame.pos?.[1] || 0).setWidth('50px').onChange(() => {
				frame.pos = frame.pos || [0, 0, 0];
				frame.pos[1] = py.getValue();
			});

			const pz = new UINumber(frame.pos?.[2] || 0).setWidth('50px').onChange(() => {
				frame.pos = frame.pos || [0, 0, 0];
				frame.pos[2] = pz.getValue();
			});

			// ===== delete =====
			const del = new UIButton('刪除').onClick(() => {

				frames.splice(index, 1);
				updateUI();

			});

			row.add(
				new UIText(`#${index}`),
				new UIText('t'),
				tInput,
				new UIText('pos'),
				px, py, pz,
				del
			);

			list.add(row);

		});

	}

	// -------------------------
	// add frame
	// -------------------------
	const addBtn = new UIButton('新增 Frame').onClick(() => {

		if (!currentObject) return;

		const frames = getFrames(currentObject);

		const last = frames.length ? frames[frames.length - 1].t : 0;

		frames.push({
			t: last + 1,
			pos: [0, 0, 0],
			rot: [0, 0, 0]
		});

		updateUI();

	});

	container.add(addBtn);

	// -------------------------
	// apply animation
	// -------------------------
	function apply(object, time) {

		const frames = object.userData.frames;
		if (!frames || frames.length < 2) return;

		let f1 = frames[0];
		let f2 = frames[frames.length - 1];

		for (let i = 0; i < frames.length - 1; i++) {

			if (time >= frames[i].t && time <= frames[i + 1].t) {
				f1 = frames[i];
				f2 = frames[i + 1];
				break;
			}

		}

		const dt = f2.t - f1.t;
		const a = dt === 0 ? 0 : (time - f1.t) / dt;

		if (f1.pos && f2.pos) {

			object.position.set(
				lerp(f1.pos[0], f2.pos[0], a),
				lerp(f1.pos[1], f2.pos[1], a),
				lerp(f1.pos[2], f2.pos[2], a)
			);

		}

		if (f1.rot && f2.rot) {

			object.rotation.set(
				lerp(f1.rot[0], f2.rot[0], a),
				lerp(f1.rot[1], f2.rot[1], a),
				lerp(f1.rot[2], f2.rot[2], a)
			);

		}

	}

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	// -------------------------
	// play system
	// -------------------------
	let playing = false;
	let start = 0;

	const playBtn = new UIButton('Play / Pause').onClick(() => {

		if (!currentObject) return;

		playing = !playing;
		start = performance.now();

	});

	container.add(playBtn);

	// -------------------------
	// select object
	// -------------------------
	editor.signals.objectSelected.add(object => {

		if (object && object.isMesh) {

			currentObject = object;
			container.setDisplay('');
			updateUI();

		} else {

			currentObject = null;
			container.setDisplay('none');

		}

	});

	// -------------------------
	// render loop
	// -------------------------
	editor.signals.rendererUpdated.add(() => {

		if (!playing || !currentObject) return;

		const t = (performance.now() - start) / 1000;

		apply(currentObject, t);

	});

	return container;

}

export { SidebarAnimate };
