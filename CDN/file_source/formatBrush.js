import E from ‘wangeditor’;
const { BtnMenu } = E;
let isBrushOn = false;

export class FormatBrush extends BtnMenu {
constructor(editor) {
// data-title属性表示当鼠标悬停在该按钮上时提示该按钮的功能简述
const $elem = E.$(
<div class="w-e-menu" data-title="格式刷" style="font-size:16px"> <i class="icon-geshishua"></i> </div>
);
super($elem, editor);
this.editor = editor;
}
// 菜单点击事件
clickHandler() {
// 做任何你想做的事情
// 可参考【常用 API】文档，来操作编辑器
if (!isBrushOn) {
if (this.editor.selection.isSelectionEmpty()) return;
let domToParse =
this.editor.selection.getSelectionContainerElem().elems[0];
this.editor.copyStyleList = parseDom(domToParse);
console.log(this.editor.selection.getRange());
this.active();
}
isBrushOn = !isBrushOn;
}
// 菜单是否被激活（如果不需要，这个函数可以空着）
// 1. 激活是什么？光标放在一段加粗、下划线的文本时，菜单栏里的 B 和 U 被激活，如下图
// 2. 什么时候执行这个函数？每次编辑器区域的选区变化（如鼠标操作、键盘操作等），都会触发各个菜单的 tryChangeActive 函数，重新计算菜单的激活状态
tryChangeActive() {
// 激活菜单
// 1. 菜单 DOM 节点会增加一个 .w-e-active 的 css class
// 2. this.isActive === true
// this.active()
// 取消激活菜单
// 1. 菜单 DOM 节点会删掉 .w-e-active
// 2. this.isActive === false
// this.unActive()
if (isBrushOn) {
this.active();
} else {
this.unActive();
}
}
}
//格式刷状态获取、修改
export function getIsBrush() {
return isBrushOn;
}
export function setIsBrush(val) {
isBrushOn = val;
}

//粘贴样式
export function pasteStyle(editor) {
if (editor.selection.isSelectionEmpty()) return;
//根据wang中选区顶级节点数判断选区行数
if (editor.selection.getSelectionRangeTopNodes().length <= 1) {
const text = editor.selection.getSelectionText();
let targetDom = addStyle(text, editor.copyStyleList);
editor.cmd.do(‘insertHTML’, targetDom.outerHTML);
} else {
let elements = [];
let range = editor.selection.getRange();
let $startElem = editor.selection.getSelectionStartElem();
//这里调用wangeditor中的dom方法，也可使用原生DOM寻找父节点方法
let $startElemCon = $startElem.parentUntil(‘p’);
let $endElem = editor.selection.getSelectionEndElem();
let $endElemCon = $endElem.parentUntil(‘p’);
elements.push({
type: ‘start’,
elem: $startElem,
offset: range.startOffset,
container: $startElemCon
});
while (!$startElemCon.next().equal($endElemCon)) {
$startElemCon = $startElemCon.next();
elements.push({
type: ‘mid’,
elem: $startElemCon,
container: $startElemCon
});
}
elements.push({
type: ‘end’,
elem: $endElem,
offset: range.endOffset,
containerType: range.startContainer.nodeType === 1 ? ‘NODE’ : ‘TEXT’,
container: $endElemCon
});
elements.forEach(element => {
const $container = element.container;
editor.selection.createRangeByElem($container, null, true);
let range = editor.selection.getRange();
if (element.type === ‘start’) {
//.firstChild这里用于定义标签中的文本，否则会报错There is no child at offset 4.
range.setStart(element.elem.elems[0].firstChild, element.offset);
} else if (element.type === ‘end’) {
range.setEnd(element.elem.elems[0].firstChild, element.offset);
}
const text = editor.selection.getSelectionText();
let targetDom = addStyle(text, editor.copyStyleList);
editor.cmd.do(‘insertHTML’, targetDom.outerHTML);
});
}
}

//获取目标节点及样式
function parseDom(dom) {
let targetDom = null;
let nodeArray = [];

getTargetDom(dom);

getAllStyle(targetDom);

function getTargetDom(dom) {
for (let i of dom.childNodes) {
if (i.nodeType === 3 && i.nodeValue && i.nodeValue.trim() !== ‘’) {
targetDom = dom;
return;
}
}
getTargetDom(dom.children[0]);
}

function getAllStyle(dom) {
if (!dom) return;
const tagName = dom.tagName.toLowerCase();
nodeArray.push({
tagName: tagName,
attributes: Array.from(dom.attributes).map(i => {
return {
name: i.name,
value: i.value
};
})
});
if ([‘p’, ‘h1’, ‘h2’, ‘h3’, ‘h4’, ‘h5’].includes(tagName)) return;
getAllStyle(dom.parentNode);
}
return nodeArray;
}

//根据保存节点信息添加样式
function addStyle(text, nodeArray) {
let currentNode = null;
nodeArray.forEach((ele, index) => {
let node = document.createElement(ele.tagName);
for (const attr of ele.attributes) {
node.setAttribute(attr.name, attr.value);
}
if (index === 0) {
node.innerText = text;
currentNode = node;
} else {
node.appendChild(currentNode);
currentNode = node;
}
});
return currentNode;
}