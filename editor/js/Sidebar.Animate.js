import { UIPanel, UIRow, UIText, UIButton, UINumber } from './libs/ui.js';

function SidebarAnimate(editor) {

	const container = new UIPanel();
	container.setBorderTop('0');
	container.setPaddingTop('20px');
	container.setDisplay('none');

	let currentObject = null;

	let draggingEl = null;
	let placeholder = null;
	let startIndex = -1;
	let isCopyMode = false;

	const title = new UIText('動畫編輯器');
	container.add(title);

	const timelineContainer = new UIPanel();
	container.add(timelineContainer);

	// ➕ 新增 frame
	const addFrameBtn = new UIButton('新增1秒').onClick(() => {

		if (!currentObject) return;

		if (!currentObject.userData.timeline) {
			currentObject.userData.timeline = { loop: true, frames: [] };
		}

		currentObject.userData.timeline.frames.push({
			t: 0,
			pos: [0,0,0],
			rot: [0,0,0],
			scl: [1,1,1]
		});

		reindex();
		updateUI();

	});

	container.add(addFrameBtn);

	// =========================
	// UI 更新
	// =========================
	function updateUI() {

		timelineContainer.clear();
		if (!currentObject) return;

		const timeline = currentObject.userData.timeline || { frames: [] };

		timeline.frames.forEach((frame, index) => {

			const row = new UIRow();
			row.dom.style.display = "flex";
			row.dom.style.alignItems = "center";
			row.dom.style.gap = "6px";
			row.dom.style.padding = "6px";
			row.dom.style.border = "1px solid #444";
			row.dom.style.marginBottom = "4px";
			row.dom.style.background = "#1e1e1e";
			row.dom.style.transition = "transform 0.15s ease";

			// 🔹 拖曳把手
			const handle = document.createElement("div");
			handle.innerHTML = "☰";
			handle.style.cursor = "grab";
			handle.style.background = "#333";
			handle.style.color = "#fff";
			handle.style.padding = "4px";

			row.dom.appendChild(handle);

			const label = new UIText(`t=${frame.t}`);
			row.add(label);

			// pos
			const posX = new UINumber(frame.pos?.[0] || 0).setWidth('40px').onChange(()=>frame.pos[0]=posX.getValue());
			const posY = new UINumber(frame.pos?.[1] || 0).setWidth('40px').onChange(()=>frame.pos[1]=posY.getValue());
			const posZ = new UINumber(frame.pos?.[2] || 0).setWidth('40px').onChange(()=>frame.pos[2]=posZ.getValue());

			row.add(posX,posY,posZ);

			// ❌ 刪除
			const del = new UIButton("X").onClick(()=>{
				timeline.frames.splice(index,1);
				reindex();
				updateUI();
			});
			row.add(del);

			timelineContainer.add(row);

			// =====================
			// 🔥 Drag 系統
			// =====================

			handle.onmousedown = (e)=>{

				e.preventDefault();

				draggingEl = row.dom;
				startIndex = index;
				isCopyMode = e.ctrlKey;

				// placeholder
				placeholder = document.createElement("div");
				placeholder.style.height = draggingEl.offsetHeight+"px";
				placeholder.style.background = "#888";
				placeholder.style.opacity = "0.3";
				placeholder.style.border = "1px dashed #aaa";

				timelineContainer.dom.insertBefore(placeholder, draggingEl);

				// 拖曳樣式
				draggingEl.style.position = "absolute";
				draggingEl.style.zIndex = "1000";
				draggingEl.style.width = placeholder.offsetWidth+"px";
				draggingEl.style.pointerEvents = "none";

				document.body.appendChild(draggingEl);

				moveAt(e.pageY);

				function moveAt(pageY){
					draggingEl.style.top = pageY - draggingEl.offsetHeight/2 + "px";
				}

				function onMouseMove(e){

					moveAt(e.pageY);

					const after = getDragAfterElement(timelineContainer.dom, e.clientY);

					if(after==null){
						timelineContainer.dom.appendChild(placeholder);
					}else{
						timelineContainer.dom.insertBefore(placeholder, after);
					}

					// 🔥 平滑動畫
					animateReorder();
				}

				document.addEventListener("mousemove", onMouseMove);

				document.addEventListener("mouseup", ()=>{

					document.removeEventListener("mousemove", onMouseMove);

					const newIndex = [...timelineContainer.dom.children].indexOf(placeholder);

					const frames = currentObject.userData.timeline.frames;

					if(isCopyMode){
						// 🔥 Ctrl 複製
						const copy = JSON.parse(JSON.stringify(frames[startIndex]));
						frames.splice(newIndex,0,copy);
					}else{
						const moved = frames.splice(startIndex,1)[0];
						frames.splice(newIndex,0,moved);
					}

					reindex();

					// 還原
					draggingEl.remove();
					placeholder.remove();

					draggingEl = null;
					placeholder = null;

					updateUI();

				},{once:true});
			};
		});
	}

	// =====================
	// 🔥 動畫滑動效果
	// =====================
	function animateReorder(){

		const items = [...timelineContainer.dom.children];

		items.forEach(el=>{
			const rect = el.getBoundingClientRect();
			el._lastY = rect.top;
		});

		requestAnimationFrame(()=>{

			items.forEach(el=>{
				const newY = el.getBoundingClientRect().top;
				const dy = el._lastY - newY;

				if(dy){
					el.style.transform = `translateY(${dy}px)`;
					el.style.transition = "none";

					requestAnimationFrame(()=>{
						el.style.transform = "";
						el.style.transition = "transform 0.15s ease";
					});
				}
			});
		});
	}

	// =====================
	// 🔧 插入位置計算
	// =====================
	function getDragAfterElement(container, y){

		const els = [...container.children].filter(el=>el!==draggingEl && el!==placeholder);

		let closest = null;
		let offset = Number.NEGATIVE_INFINITY;

		els.forEach(child=>{
			const box = child.getBoundingClientRect();
			const diff = y - box.top - box.height/2;

			if(diff < 0 && diff > offset){
				offset = diff;
				closest = child;
			}
		});

		return closest;
	}

	// =====================
	function reindex(){
		const frames = currentObject.userData.timeline.frames;
		frames.forEach((f,i)=>f.t=i);
	}
	// =====================

	editor.signals.objectSelected.add((object)=>{

		if(object && object.isMesh){
			currentObject = object;
			container.setDisplay('');
			updateUI();
		}else{
			currentObject = null;
			container.setDisplay('none');
		}
	});

	return container;
}

export { SidebarAnimate };
