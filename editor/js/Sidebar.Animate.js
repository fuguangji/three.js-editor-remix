import { UIPanel, UIRow, UIText, UIButton, UINumber } from './libs/ui.js';

function SidebarAnimate(editor) {

	const container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay('none');

	let currentObject = null;

	const title = new UIText('動畫編輯器');
	container.add(title);

	const timelineContainer = new UIPanel();
	container.add(timelineContainer);

	// -------------------------
	// 工具：確保 timeline
	// -------------------------
	function ensureTimeline(obj) {

		if (!obj.userData.timeline) {

			obj.userData.timeline = {
				loop: true,
				frames: []
			};

		}

		return obj.userData.timeline;

	}

	// -------------------------
	// 新增 frame（固定 +1 秒）
	// -------------------------
	const addFrameBtn = new UIButton('新增 1 秒帧').onClick(() => {

		if (!currentObject) return;

		const timeline = ensureTimeline(currentObject);

		const lastT = timeline.frames.length
			? timeline.frames[timeline.frames.length - 1].t
			: 0;

		timeline.frames.push({
			t: lastT + 1,
			pos: [0, 0, 0],
			rot: [0, 0, 0],
			scl: [1, 1, 1]
		});

		sortFrames();
		updateUI();

	});

	container.add(addFrameBtn);

	// -------------------------
	// 排序 frames
	// -------------------------
	function sortFrames() {

		if (!currentObject) return;

		const timeline = currentObject.userData.timeline;
		timeline.frames.sort((a, b) => a.t - b.t);

	}

	// -------------------------
	// UI 更新
	// -------------------------
	function updateUI() {

		timelineContainer.clear();

		if (!currentObject) return;

		const timeline = ensureTimeline(currentObject);

		timeline.frames.forEach((frame, index) => {

			const row = new UIRow();

			// ====== 可拖時間（核心）======
			const tInput = new UINumber(frame.t)
				.setWidth('60px')
				.setRange(0, 999)
				.onChange(() => {

					frame.t = tInput.getValue();
					sortFrames();
					updateUI();

				});

			// ====== position ======
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

			// ====== delete ======
			const delBtn = new UIButton('刪除').onClick(() => {

				const timeline = currentObject.userData.timeline;
				timeline.frames.splice(index, 1);
				updateUI();

			});

			// label
			row.add(
				new UIText(`Frame ${index}`),
				new UIText('t'),
				tInput,
				new UIText('pos'),
				px, py, pz,
				delBtn
			);

			timelineContainer.add(row);

		});

	}

	// -------------------------
	// 播放控制
	// -------------------------
	let playing = false;
	let startTime = 0;

	const playBtn = new UIButton('播放 / 暫停').onClick(() => {

		if (!currentObject) return;

		playing = !playing;
		startTime = performance.now();

	});

	container.add(playBtn);

	// -------------------------
	// 套用 timeline
	// -------------------------
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

		const dt = f2.t - f1.t;
		const a = dt === 0 ? 0 : (time - f1.t) / dt;

		// position
		if (f1.pos && f2.pos) {

			object.position.set(
				lerp(f1.pos[0], f2.pos[0], a),
				lerp(f1.pos[1], f2.pos[1], a),
				lerp(f1.pos[2], f2.pos[2], a)
			);

		}

		// rotation
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
	// 選取物件
	// -------------------------
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

	// -------------------------
	// 每幀更新播放
	// -------------------------
	editor.signals.rendererUpdated.add(function () {

		if (!playing || !currentObject) return;

		const t = (performance.now() - startTime) / 1000;

		applyTimeline(currentObject, t);

	});

	return container;

}

export { SidebarAnimate };
