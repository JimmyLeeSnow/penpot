var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _rootNode, _currentNode, _added, _removed, _updated, _textEditor, _selection, _ranges, _range, _focusNode, _focusOffset, _anchorNode, _anchorOffset, _savedSelection, _textNodeIterator, _currentStyle, _inertElement, _debug, _mutations, _SelectionController_instances, applyStylesToCurrentStyle_fn, updateCurrentStyle_fn, _onSelectionChange, setup_fn, getSavedRange_fn, applyStylesTo_fn, applyStylesToSavedSelection_fn, applyStylesToCurrentSelection_fn, _timeout, _target, _time, _hasPendingChanges, _onTimeout, _element, _events, _root, _changeController, _selectionController, _selectionImposterElement, _styleDefaults, _TextEditor_instances, setupElementProperties_fn, setupRoot_fn, setup_fn2, _onBlur, _onFocus, _onPaste, _onCut, _onCopy, _onBeforeInput, notifyLayout_fn;
function copy(event, editor) {
}
function cut(event, editor) {
}
function setStyle(element, styleName, styleValue, styleUnit) {
  if (styleName.startsWith("--") && typeof styleValue !== "string" && typeof styleValue !== "number") {
    if (styleName === "--fills" && styleValue === null) debugger;
    element.style.setProperty(styleName, JSON.stringify(styleValue));
  } else {
    element.style.setProperty(styleName, styleValue + (styleUnit ?? ""));
  }
  return element;
}
function setStylesFromObject(element, allowedStyles, styleObject) {
  for (const [styleName, styleUnit] of allowedStyles) {
    const styleValue = styleObject[styleName];
    if (styleValue) {
      setStyle(element, styleName, styleValue, styleUnit);
    }
  }
  return element;
}
function setStylesFromDeclaration(element, allowedStyles, styleDeclaration) {
  for (const [styleName, styleUnit] of allowedStyles) {
    const styleValue = styleDeclaration.getPropertyValue(styleName);
    if (styleValue) {
      setStyle(element, styleName, styleValue, styleUnit);
    }
  }
  return element;
}
function setStyles(element, allowedStyles, styleObjectOrDeclaration) {
  if (styleObjectOrDeclaration instanceof CSSStyleDeclaration) {
    return setStylesFromDeclaration(
      element,
      allowedStyles,
      styleObjectOrDeclaration
    );
  }
  return setStylesFromObject(element, allowedStyles, styleObjectOrDeclaration);
}
function isDisplayBlock(style) {
  return style.display === "block";
}
function createRandomId() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
}
function createElement(tag, options) {
  const element = document.createElement(tag);
  if (options == null ? void 0 : options.attributes) {
    Object.entries(options.attributes).forEach(
      ([name, value]) => element.setAttribute(name, value)
    );
  }
  if (options == null ? void 0 : options.data) {
    Object.entries(options.data).forEach(
      ([name, value]) => element.dataset[name] = value
    );
  }
  if ((options == null ? void 0 : options.styles) && (options == null ? void 0 : options.allowedStyles)) {
    setStyles(element, options.allowedStyles, options.styles);
  }
  if (options == null ? void 0 : options.children) {
    if (Array.isArray(options.children)) {
      element.append(...options.children);
    } else {
      element.appendChild(options.children);
    }
  }
  return element;
}
function isElement(element, nodeName) {
  return element.nodeType === Node.ELEMENT_NODE && element.nodeName === nodeName.toUpperCase();
}
function isOffsetAtStart(node, offset) {
  return offset === 0;
}
function isOffsetAtEnd(node, offset) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue.length === offset;
  }
  return true;
}
const TAG$3 = "BR";
function createLineBreak() {
  return document.createElement(TAG$3);
}
function isLineBreak(node) {
  return node.nodeType === Node.ELEMENT_NODE && node.nodeName === TAG$3;
}
const TAG$2 = "SPAN";
const TYPE$2 = "inline";
const QUERY$1 = `[data-itype="${TYPE$2}"]`;
const STYLES$2 = [
  ["--typography-ref-id"],
  ["--typography-ref-file"],
  ["--font-id"],
  ["font-variant"],
  ["font-family"],
  ["font-size", "px"],
  ["font-weight"],
  ["font-style"],
  ["line-height"],
  ["letter-spacing", "px"],
  ["text-decoration"],
  ["text-transform"],
  ["--fills"]
];
function isInline(node) {
  if (!node) return false;
  if (!isElement(node, TAG$2)) return false;
  if (node.dataset.itype !== TYPE$2) return false;
  return true;
}
function isLikeInline(element) {
  return element ? [
    "A",
    "ABBR",
    "ACRONYM",
    "B",
    "BDO",
    "BIG",
    "BR",
    "BUTTON",
    "CITE",
    "CODE",
    "DFN",
    "EM",
    "I",
    "IMG",
    "INPUT",
    "KBD",
    "LABEL",
    "MAP",
    "OBJECT",
    "OUTPUT",
    "Q",
    "SAMP",
    "SCRIPT",
    "SELECT",
    "SMALL",
    "SPAN",
    "STRONG",
    "SUB",
    "SUP",
    "TEXTAREA",
    "TIME",
    "TT",
    "VAR"
  ].includes(element.nodeName) : false;
}
function createInline(textOrLineBreak, styles, attrs) {
  if (!(textOrLineBreak instanceof HTMLBRElement) && !(textOrLineBreak instanceof Text)) {
    throw new TypeError("Invalid inline child");
  }
  return createElement(TAG$2, {
    attributes: { id: createRandomId(), ...attrs },
    data: { itype: TYPE$2 },
    styles,
    allowedStyles: STYLES$2,
    children: textOrLineBreak
  });
}
function createEmptyInline(styles) {
  return createInline(createLineBreak(), styles);
}
function setInlineStyles(element, styles) {
  return setStyles(element, STYLES$2, styles);
}
function getInline(node) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) {
    const inline = node.parentElement;
    if (!isInline(inline)) return null;
    return inline;
  }
  return node.closest(QUERY$1);
}
function isInlineStart(node, offset) {
  const inline = getInline(node);
  if (!inline) return false;
  return isOffsetAtStart(inline, offset);
}
function isInlineEnd(node, offset) {
  const inline = getInline(node);
  if (!inline) return false;
  return isOffsetAtEnd(inline.firstChild, offset);
}
function splitInline(inline, offset) {
  const textNode = inline.firstChild;
  const style = inline.style;
  const newTextNode = textNode.splitText(offset);
  return createInline(newTextNode, style);
}
function getInlinesFrom(startInline) {
  const inlines = [];
  let currentInline = startInline;
  let index = 0;
  while (currentInline) {
    if (index > 0) inlines.push(currentInline);
    currentInline = currentInline.nextElementSibling;
    index++;
  }
  return inlines;
}
function getInlineLength(inline) {
  if (!isInline(inline)) throw new Error("Invalid inline");
  if (isLineBreak(inline.firstChild)) return 0;
  return inline.firstChild.nodeValue.length;
}
const TAG$1 = "DIV";
const TYPE$1 = "paragraph";
const QUERY = `[data-itype="${TYPE$1}"]`;
const STYLES$1 = [
  ["text-align"],
  ["direction"],
  ["line-height"],
  ["font-size", "px"]
];
function isLikeParagraph(element) {
  return !isLikeInline(element);
}
function isEmptyParagraph(element) {
  if (!isParagraph(element)) throw new TypeError("Invalid paragraph");
  const inline = element.firstChild;
  if (!isInline(inline)) throw new TypeError("Invalid inline");
  return isLineBreak(inline.firstChild);
}
function isParagraph(node) {
  if (!node) return false;
  if (!isElement(node, TAG$1)) return false;
  if (node.dataset.itype !== TYPE$1) return false;
  return true;
}
function createParagraph(inlines, styles, attrs) {
  if (inlines && (!Array.isArray(inlines) || !inlines.every(isInline)))
    throw new TypeError("Invalid paragraph children");
  return createElement(TAG$1, {
    attributes: { id: createRandomId(), ...attrs },
    data: { itype: TYPE$1 },
    styles,
    allowedStyles: STYLES$1,
    children: inlines
  });
}
function createEmptyParagraph(styles) {
  return createParagraph([
    createEmptyInline(styles)
  ], styles);
}
function setParagraphStyles(element, styles) {
  return setStyles(element, STYLES$1, styles);
}
function getParagraph(node) {
  if (node.nodeType === Node.TEXT_NODE || isLineBreak(node)) {
    const paragraph = node.parentElement.parentElement;
    if (!isParagraph(paragraph)) return null;
    return paragraph;
  }
  return node.closest(QUERY);
}
function isParagraphStart(node, offset) {
  const paragraph = getParagraph(node);
  if (!paragraph)
    throw new Error("Can't find the paragraph");
  const inline = getInline(node);
  if (!inline)
    throw new Error("Can't find the inline");
  return paragraph.firstElementChild === inline && isOffsetAtStart(inline.firstChild, offset);
}
function isParagraphEnd(node, offset) {
  const paragraph = getParagraph(node);
  if (!paragraph)
    throw new Error("Cannot find the paragraph");
  const inline = getInline(node);
  if (!inline)
    throw new Error("Cannot find the inline");
  return paragraph.lastElementChild === inline && isOffsetAtEnd(inline.firstChild, offset);
}
function splitParagraph(paragraph, inline, offset) {
  const style = paragraph.style;
  if (isInlineEnd(inline, offset)) {
    const newParagraph2 = createParagraph(getInlinesFrom(inline), style);
    return newParagraph2;
  }
  const newInline = splitInline(inline, offset);
  const newParagraph = createParagraph([newInline], style);
  return newParagraph;
}
function splitParagraphAtNode(paragraph, startIndex) {
  const style = paragraph.style;
  const newParagraph = createParagraph(null, style);
  const newInlines = [];
  for (let index = startIndex; index < paragraph.children.length; index++) {
    newInlines.push(paragraph.children.item(index));
  }
  newParagraph.append(...newInlines);
  return newParagraph;
}
function mergeParagraphs(a, b) {
  a.append(...b.children);
  b.remove();
  return a;
}
function mapContentFragmentFromDocument(document2, root) {
  const nodeIterator = document2.createNodeIterator(root, NodeFilter.SHOW_TEXT);
  const fragment = document2.createDocumentFragment();
  let currentParagraph = null;
  let currentNode = nodeIterator.nextNode();
  while (currentNode) {
    const parentStyle = window.getComputedStyle(currentNode.parentElement);
    if (isDisplayBlock(currentNode.parentElement.style) || isDisplayBlock(parentStyle) || isLikeParagraph(currentNode.parentElement)) {
      if (currentParagraph) {
        fragment.appendChild(currentParagraph);
      }
      currentParagraph = createParagraph(
        void 0,
        parentStyle
      );
    } else {
      if (currentParagraph === null) {
        currentParagraph = createParagraph();
      }
    }
    currentParagraph.appendChild(
      createInline(
        new Text(currentNode.nodeValue),
        parentStyle
      )
    );
    currentNode = nodeIterator.nextNode();
  }
  fragment.appendChild(currentParagraph);
  return fragment;
}
function mapContentFragmentFromString(html) {
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(html, "text/html");
  return mapContentFragmentFromDocument(htmlDocument, htmlDocument.documentElement);
}
function paste(event, editor) {
  if (event.clipboardData.types.includes("text/html")) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const fragment = mapContentFragmentFromString(html);
    const selection = window.getSelection();
    if (!selection.rangeCount)
      return;
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(fragment);
    selection.collapseToEnd();
  } else if (event.clipboardData.types.includes("text/plain")) {
    const plain = event.clipboardData.getData("text/plain");
    event.clipboardData.clearData();
    event.clipboardData.setData("text/plain", plain);
  } else {
    event.preventDefault();
  }
}
const clipboard = {
  copy,
  cut,
  paste
};
function insertText(event, editor, selectionController) {
  event.preventDefault();
  if (selectionController.isCollapsed) {
    if (selectionController.isTextFocus) {
      return selectionController.insertText(event.data);
    } else if (selectionController.isLineBreakFocus) {
      return selectionController.replaceLineBreak(event.data);
    }
  }
  if (selectionController.isTextSame) {
    return selectionController.replaceText(event.data);
  } else if (selectionController.isMultiInline) {
    return selectionController.replaceInlines(event.data);
  } else if (selectionController.isMultiParagraph) {
    return selectionController.replaceParagraphs(event.data);
  }
}
function tryOffset(offset) {
  if (!Number.isInteger(offset) || offset < 0)
    throw new TypeError("Invalid offset");
}
function tryString(str) {
  if (typeof str !== "string") throw new TypeError("Invalid string");
}
function insertInto(str, offset, text) {
  tryString(str);
  tryOffset(offset);
  tryString(text);
  return str.slice(0, offset) + text + str.slice(offset);
}
function replaceWith(str, startOffset, endOffset, text) {
  tryString(str);
  tryOffset(startOffset);
  tryOffset(endOffset);
  tryString(text);
  return str.slice(0, startOffset) + text + str.slice(endOffset);
}
function removeBackward(str, offset) {
  tryString(str);
  tryOffset(offset);
  if (offset === 0) {
    return str;
  }
  return str.slice(0, offset - 1) + str.slice(offset);
}
function removeForward(str, offset) {
  tryString(str);
  tryOffset(offset);
  return str.slice(0, offset) + str.slice(offset + 1);
}
function getTextNodeLength(node) {
  if (!node) throw new TypeError("Invalid text node");
  if (isLineBreak(node)) return 0;
  return node.nodeValue.length;
}
const TextNodeIteratorDirection = {
  FORWARD: 1,
  BACKWARD: 0
};
const _TextNodeIterator = class _TextNodeIterator {
  /**
   * Constructor
   *
   * @param {HTMLElement} rootNode
   */
  constructor(rootNode) {
    /**
     * This is the root text node.
     *
     * @type {HTMLElement}
     */
    __privateAdd(this, _rootNode, null);
    /**
     * This is the current text node.
     *
     * @type {Text|null}
     */
    __privateAdd(this, _currentNode, null);
    if (!(rootNode instanceof HTMLElement)) {
      throw new TypeError("Invalid root node");
    }
    __privateSet(this, _rootNode, rootNode);
    __privateSet(this, _currentNode, _TextNodeIterator.findDown(rootNode, rootNode));
  }
  /**
   * Returns if a specific node is a text node.
   *
   * @param {Node} node
   * @returns {boolean}
   */
  static isTextNode(node) {
    return node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE && node.nodeName === "BR";
  }
  /**
   * Returns if a specific node is a container node.
   *
   * @param {Node} node
   * @returns {boolean}
   */
  static isContainerNode(node) {
    return node.nodeType === Node.ELEMENT_NODE && node.nodeName !== "BR";
  }
  /**
   * Finds a node from an initial node and down the tree.
   *
   * @param {Node} startNode
   * @param {Node} rootNode
   * @param {Set<Node>} skipNodes
   * @param {number} direction
   * @returns {Node}
   */
  static findDown(startNode, rootNode, skipNodes = /* @__PURE__ */ new Set(), direction = TextNodeIteratorDirection.FORWARD) {
    if (startNode === rootNode) {
      return _TextNodeIterator.findDown(
        direction === TextNodeIteratorDirection.FORWARD ? startNode.firstChild : startNode.lastChild,
        rootNode,
        skipNodes,
        direction
      );
    }
    let currentNode = startNode;
    while (currentNode) {
      if (skipNodes.has(currentNode)) {
        currentNode = direction === TextNodeIteratorDirection.FORWARD ? currentNode.nextSibling : currentNode.previousSibling;
        continue;
      }
      if (_TextNodeIterator.isTextNode(currentNode)) {
        return currentNode;
      } else if (_TextNodeIterator.isContainerNode(currentNode)) {
        return _TextNodeIterator.findDown(
          direction === TextNodeIteratorDirection.FORWARD ? currentNode.firstChild : currentNode.lastChild,
          rootNode,
          skipNodes,
          direction
        );
      }
      currentNode = direction === TextNodeIteratorDirection.FORWARD ? currentNode.nextSibling : currentNode.previousSibling;
    }
    return null;
  }
  /**
   * Finds a node from an initial node and up the tree.
   *
   * @param {Node} startNode
   * @param {Node} rootNode
   * @param {Set} backTrack
   * @param {number} direction
   * @returns {Node}
   */
  static findUp(startNode, rootNode, backTrack = /* @__PURE__ */ new Set(), direction = TextNodeIteratorDirection.FORWARD) {
    backTrack.add(startNode);
    if (_TextNodeIterator.isTextNode(startNode)) {
      return _TextNodeIterator.findUp(
        startNode.parentNode,
        rootNode,
        backTrack,
        direction
      );
    } else if (_TextNodeIterator.isContainerNode(startNode)) {
      const found = _TextNodeIterator.findDown(
        startNode,
        rootNode,
        backTrack,
        direction
      );
      if (found) {
        return found;
      }
      if (startNode !== rootNode) {
        return _TextNodeIterator.findUp(
          startNode.parentNode,
          rootNode,
          backTrack,
          direction
        );
      }
    }
    return null;
  }
  /**
   * Current node we're into.
   *
   * @type {TextNode|HTMLBRElement}
   */
  get currentNode() {
    return __privateGet(this, _currentNode);
  }
  set currentNode(newCurrentNode) {
    const isContained = (newCurrentNode.compareDocumentPosition(__privateGet(this, _rootNode)) & Node.DOCUMENT_POSITION_CONTAINS) === Node.DOCUMENT_POSITION_CONTAINS;
    if (!(newCurrentNode instanceof Node) || !_TextNodeIterator.isTextNode(newCurrentNode) || !isContained) {
      throw new TypeError("Invalid new current node");
    }
    __privateSet(this, _currentNode, newCurrentNode);
  }
  /**
   * Returns the next Text node or <br> element or null if there are.
   *
   * @returns {Text|HTMLBRElement}
   */
  nextNode() {
    if (!__privateGet(this, _currentNode))
      return null;
    const nextNode = _TextNodeIterator.findUp(
      __privateGet(this, _currentNode),
      __privateGet(this, _rootNode),
      /* @__PURE__ */ new Set(),
      TextNodeIteratorDirection.FORWARD
    );
    if (!nextNode) {
      return null;
    }
    __privateSet(this, _currentNode, nextNode);
    return __privateGet(this, _currentNode);
  }
  /**
   * Returns the previous Text node or <br> element or null.
   *
   * @returns {Text|HTMLBRElement}
   */
  previousNode() {
    if (!__privateGet(this, _currentNode))
      return null;
    const previousNode = _TextNodeIterator.findUp(
      __privateGet(this, _currentNode),
      __privateGet(this, _rootNode),
      /* @__PURE__ */ new Set(),
      TextNodeIteratorDirection.BACKWARD
    );
    if (!previousNode) {
      return null;
    }
    __privateSet(this, _currentNode, previousNode);
    return __privateGet(this, _currentNode);
  }
};
_rootNode = new WeakMap();
_currentNode = new WeakMap();
let TextNodeIterator = _TextNodeIterator;
class CommandMutations {
  constructor(added, updated, removed) {
    __privateAdd(this, _added, /* @__PURE__ */ new Set());
    __privateAdd(this, _removed, /* @__PURE__ */ new Set());
    __privateAdd(this, _updated, /* @__PURE__ */ new Set());
    if (added && Array.isArray(added))
      __privateSet(this, _added, new Set(added));
    if (updated && Array.isArray(updated))
      __privateSet(this, _updated, new Set(updated));
    if (removed && Array.isArray(removed))
      __privateSet(this, _removed, new Set(removed));
  }
  get added() {
    return __privateGet(this, _added);
  }
  get removed() {
    return __privateGet(this, _removed);
  }
  get updated() {
    return __privateGet(this, _updated);
  }
  clear() {
    __privateGet(this, _added).clear();
    __privateGet(this, _removed).clear();
    __privateGet(this, _updated).clear();
  }
  dispose() {
    __privateGet(this, _added).clear();
    __privateSet(this, _added, null);
    __privateGet(this, _removed).clear();
    __privateSet(this, _removed, null);
    __privateGet(this, _updated).clear();
    __privateSet(this, _updated, null);
  }
  add(node) {
    __privateGet(this, _added).add(node);
    return this;
  }
  remove(node) {
    __privateGet(this, _removed).add(node);
    return this;
  }
  update(node) {
    __privateGet(this, _updated).add(node);
    return this;
  }
}
_added = new WeakMap();
_removed = new WeakMap();
_updated = new WeakMap();
const TAG = "DIV";
const TYPE = "root";
const STYLES = [["vertical-align"]];
function createRoot(paragraphs, styles, attrs) {
  if (!Array.isArray(paragraphs) || !paragraphs.every(isParagraph))
    throw new TypeError("Invalid root children");
  return createElement(TAG, {
    attributes: { id: createRandomId(), ...attrs },
    data: { itype: TYPE },
    styles,
    allowedStyles: STYLES,
    children: paragraphs
  });
}
function createEmptyRoot(styles) {
  return createRoot([
    createEmptyParagraph(styles)
  ], styles);
}
function setRootStyles(element, styles) {
  return setStyles(element, STYLES, styles);
}
const SelectionDirection = {
  /** The anchorNode is behind the focusNode  */
  FORWARD: 1,
  /** The focusNode and the anchorNode are collapsed */
  NONE: 0,
  /** The focusNode is behind the anchorNode */
  BACKWARD: -1
};
class SelectionController {
  /**
   * Constructor
   *
   * @param {TextEditor} textEditor
   * @param {Selection} selection
   * @param {SelectionControllerOptions} [options]
   */
  constructor(textEditor, selection, options) {
    __privateAdd(this, _SelectionController_instances);
    /**
     * Reference to the text editor.
     *
     * @type {TextEditor}
     */
    __privateAdd(this, _textEditor, null);
    /**
     * Selection.
     *
     * @type {Selection}
     */
    __privateAdd(this, _selection, null);
    /**
     * Set of ranges (this should always have one)
     *
     * @type {Set<Range>}
     */
    __privateAdd(this, _ranges, /* @__PURE__ */ new Set());
    /**
     * Current range (.rangeAt 0)
     *
     * @type {Range}
     */
    __privateAdd(this, _range, null);
    /**
     * @type {Node}
     */
    __privateAdd(this, _focusNode, null);
    /**
     * @type {number}
     */
    __privateAdd(this, _focusOffset, 0);
    /**
     * @type {Node}
     */
    __privateAdd(this, _anchorNode, null);
    /**
     * @type {number}
     */
    __privateAdd(this, _anchorOffset, 0);
    /**
     * Saved selection.
     *
     * @type {object}
     */
    __privateAdd(this, _savedSelection, null);
    /**
     * TextNodeIterator that allows us to move
     * around the root element but only through
     * <br> and #text nodes.
     *
     * @type {TextNodeIterator}
     */
    __privateAdd(this, _textNodeIterator, null);
    /**
     * CSSStyleDeclaration that we can mutate
     * to handle style changes.
     *
     * @type {CSSStyleDeclaration}
     */
    __privateAdd(this, _currentStyle, null);
    /**
     * Element used to have a custom CSSStyleDeclaration
     * that we can modify to handle style changes when the
     * selection is changed.
     *
     * @type {HTMLDivElement}
     */
    __privateAdd(this, _inertElement, null);
    /**
     * @type {SelectionControllerDebug}
     */
    __privateAdd(this, _debug, null);
    /**
     * @type {CommandMutations}
     */
    __privateAdd(this, _mutations, new CommandMutations());
    /**
     * This is called on every `selectionchange` because it is dispatched
     * only by the `document` object.
     *
     * @param {Event} e
     */
    __privateAdd(this, _onSelectionChange, (e) => {
      if (!this.hasFocus) return;
      let focusNodeChanges = false;
      if (__privateGet(this, _focusNode) !== __privateGet(this, _selection).focusNode) {
        __privateSet(this, _focusNode, __privateGet(this, _selection).focusNode);
        focusNodeChanges = true;
      }
      __privateSet(this, _focusOffset, __privateGet(this, _selection).focusOffset);
      if (__privateGet(this, _anchorNode) !== __privateGet(this, _selection).anchorNode) {
        __privateSet(this, _anchorNode, __privateGet(this, _selection).anchorNode);
      }
      __privateSet(this, _anchorOffset, __privateGet(this, _selection).anchorOffset);
      if (__privateGet(this, _selection).rangeCount > 1) {
        for (let index = 0; index < __privateGet(this, _selection).rangeCount; index++) {
          const range = __privateGet(this, _selection).getRangeAt(index);
          if (__privateGet(this, _ranges).has(range)) {
            __privateGet(this, _ranges).delete(range);
            __privateGet(this, _selection).removeRange(range);
          } else {
            __privateGet(this, _ranges).add(range);
            __privateSet(this, _range, range);
          }
        }
      } else if (__privateGet(this, _selection).rangeCount > 0) {
        const range = __privateGet(this, _selection).getRangeAt(0);
        __privateSet(this, _range, range);
        __privateGet(this, _ranges).clear();
        __privateGet(this, _ranges).add(range);
      } else {
        __privateSet(this, _range, null);
        __privateGet(this, _ranges).clear();
      }
      if (focusNodeChanges) {
        const inline = getInline(__privateGet(this, _selection).focusNode);
        if (inline) {
          __privateMethod(this, _SelectionController_instances, updateCurrentStyle_fn).call(this, inline);
          __privateGet(this, _textEditor).dispatchEvent(
            new CustomEvent("stylechange", {
              detail: __privateGet(this, _currentStyle)
            })
          );
        }
      }
      if (__privateGet(this, _debug)) {
        __privateGet(this, _debug).update(this);
      }
    });
    __privateSet(this, _debug, options == null ? void 0 : options.debug);
    __privateSet(this, _selection, selection);
    __privateSet(this, _textEditor, textEditor);
    __privateSet(this, _textNodeIterator, new TextNodeIterator(__privateGet(this, _textEditor).element));
    __privateSet(this, _inertElement, document.createElement("div"));
    __privateSet(this, _currentStyle, __privateGet(this, _inertElement).style);
    __privateMethod(this, _SelectionController_instances, setup_fn).call(this);
  }
  /**
   * Saves the current selection and returns the client rects.
   *
   * @returns {boolean}
   */
  saveSelection() {
    __privateSet(this, _savedSelection, {
      isCollapsed: __privateGet(this, _selection).isCollapsed,
      focusNode: __privateGet(this, _focusNode),
      focusOffset: __privateGet(this, _focusOffset),
      anchorNode: __privateGet(this, _anchorNode),
      anchorOffset: __privateGet(this, _anchorOffset),
      range: __privateMethod(this, _SelectionController_instances, getSavedRange_fn).call(this)
    });
    return true;
  }
  /**
   * Restores a saved selection if there's any.
   *
   * @returns {boolean}
   */
  restoreSelection() {
    if (!__privateGet(this, _savedSelection)) return false;
    __privateGet(this, _selection).setBaseAndExtent(
      __privateGet(this, _savedSelection).anchorNode,
      __privateGet(this, _savedSelection).anchorOffset,
      __privateGet(this, _savedSelection).focusNode,
      __privateGet(this, _savedSelection).focusOffset
    );
    __privateSet(this, _savedSelection, null);
    return true;
  }
  startCommand() {
    __privateGet(this, _mutations).clear();
  }
  endCommand() {
    return __privateGet(this, _mutations);
  }
  /**
   * Selects all content.
   */
  selectAll() {
    __privateGet(this, _selection).selectAllChildren(__privateGet(this, _textEditor).root);
  }
  /**
   * Collapses a selection.
   *
   * @param {Node} node
   * @param {number} offset
   */
  collapse(node, offset) {
    if (__privateGet(this, _savedSelection)) {
      __privateGet(this, _savedSelection).focusNode = node;
      __privateGet(this, _savedSelection).focusOffset = offset;
    } else {
      __privateGet(this, _selection).collapse(node, offset);
    }
  }
  /**
   * Sets base and extent.
   *
   * @param {Node} anchorNode
   * @param {number} anchorOffset
   * @param {Node} focusNode
   * @param {number} focusOffset
   */
  setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset) {
    if (__privateGet(this, _savedSelection)) {
      __privateGet(this, _savedSelection).isCollapsed = focusNode === anchorNode && anchorOffset === focusOffset;
      __privateGet(this, _savedSelection).focusNode = focusNode;
      __privateGet(this, _savedSelection).focusOffset = focusOffset;
      __privateGet(this, _savedSelection).anchorNode = anchorNode;
      __privateGet(this, _savedSelection).anchorOffset = anchorOffset;
      __privateGet(this, _savedSelection).range.collapsed = __privateGet(this, _savedSelection).isCollapsed;
      const position = focusNode.compareDocumentPosition(anchorNode);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        __privateGet(this, _savedSelection).range.startContainer = focusNode;
        __privateGet(this, _savedSelection).range.startOffset = focusOffset;
        __privateGet(this, _savedSelection).range.endContainer = anchorNode;
        __privateGet(this, _savedSelection).range.endOffset = anchorOffset;
      } else {
        __privateGet(this, _savedSelection).range.startContainer = anchorNode;
        __privateGet(this, _savedSelection).range.startOffset = anchorOffset;
        __privateGet(this, _savedSelection).range.endContainer = focusNode;
        __privateGet(this, _savedSelection).range.endOffset = focusOffset;
      }
    } else {
      __privateGet(this, _selection).setBaseAndExtent(
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset
      );
    }
  }
  /**
   * Disposes the current resources.
   */
  dispose() {
    document.removeEventListener("selectionchange", __privateGet(this, _onSelectionChange));
    __privateSet(this, _textEditor, null);
    __privateGet(this, _ranges).clear();
    __privateSet(this, _ranges, null);
    __privateSet(this, _range, null);
    __privateSet(this, _selection, null);
    __privateSet(this, _focusNode, null);
    __privateSet(this, _anchorNode, null);
    __privateGet(this, _mutations).dispose();
    __privateSet(this, _mutations, null);
  }
  /**
   * Returns the current selection.
   *
   * @type {Selection}
   */
  get selection() {
    return __privateGet(this, _selection);
  }
  /**
   * Returns the current range.
   *
   * @type {Range}
   */
  get range() {
    return __privateGet(this, _range);
  }
  /**
   * Indicates the direction of the selection
   *
   * @type {SelectionDirection}
   */
  get direction() {
    if (this.isCollapsed || __privateGet(this, _range).startContainer === __privateGet(this, _range).endContainer)
      return SelectionDirection.NONE;
    return __privateGet(this, _range).startContainer === __privateGet(this, _selection).focusNode ? SelectionDirection.BACKWARD : SelectionDirection.FORWARD;
  }
  /**
   * Indicates that the editor element has the
   * focus.
   *
   * @type {boolean}
   */
  get hasFocus() {
    return document.activeElement === __privateGet(this, _textEditor).element;
  }
  /**
   * Returns true if the selection is collapsed (caret)
   * or false otherwise.
   *
   * @type {boolean}
   */
  get isCollapsed() {
    if (__privateGet(this, _savedSelection)) {
      return __privateGet(this, _savedSelection).isCollapsed;
    }
    return __privateGet(this, _selection).isCollapsed;
  }
  /**
   * @type {Node}
   */
  get anchorNode() {
    if (__privateGet(this, _savedSelection)) {
      return __privateGet(this, _savedSelection).anchorNode;
    }
    return __privateGet(this, _anchorNode);
  }
  /**
   * @type {number}
   */
  get anchorOffset() {
    if (__privateGet(this, _savedSelection)) {
      return __privateGet(this, _savedSelection).anchorOffset;
    }
    return __privateGet(this, _selection).anchorOffset;
  }
  /**
   * @type {Node}
   */
  get focusNode() {
    if (__privateGet(this, _savedSelection)) {
      return __privateGet(this, _savedSelection).focusNode;
    }
    return __privateGet(this, _focusNode);
  }
  /**
   * @type {number}
   */
  get focusOffset() {
    if (__privateGet(this, _savedSelection)) {
      return __privateGet(this, _savedSelection).focusOffset;
    }
    return __privateGet(this, _selection).focusOffset;
  }
  /**
   * Indicates that the caret is at the start of the node.
   *
   * @type {boolean}
   */
  get focusAtStart() {
    return this.focusOffset === 0;
  }
  /**
   * Indicates that the caret is at the end of the node.
   *
   * @type {boolean}
   */
  get focusAtEnd() {
    return this.focusOffset === this.focusNode.nodeValue.length;
  }
  /**
   * Returns the paragraph in the focus node
   * of the current selection.
   *
   * @type {HTMLElement|null}
   */
  get focusParagraph() {
    return getParagraph(__privateGet(this, _selection).focusNode);
  }
  /**
   * Returns the inline in the focus node
   * of the current selection.
   *
   * @type {HTMLElement|null}
   */
  get focusInline() {
    return getInline(__privateGet(this, _selection).focusNode);
  }
  /**
   * Returns the current paragraph in the anchor
   * node of the current selection.
   *
   * @type {HTMLElement|null}
   */
  get anchorParagraph() {
    return getParagraph(__privateGet(this, _selection).anchorNode);
  }
  /**
   * Returns the current inline in the anchor
   * node of the current selection.
   *
   * @type {HTMLElement|null}
   */
  get anchorInline() {
    return getInline(__privateGet(this, _selection).anchorNode);
  }
  /**
   * `startOffset` of the current range.
   *
   * @type {number|null}
   */
  get startOffset() {
    var _a;
    return (_a = __privateGet(this, _range)) == null ? void 0 : _a.startOffset;
  }
  /**
   * Start paragraph of the current range.
   *
   * @type {HTMLElement|null}
   */
  get startParagraph() {
    if (!__privateGet(this, _range)) {
      return null;
    }
    return getParagraph(__privateGet(this, _range).startContainer);
  }
  /**
   * Start inline of the current page.
   *
   * @type {HTMLElement|null}
   */
  get startInline() {
    if (!__privateGet(this, _range)) {
      return null;
    }
    return getInline(__privateGet(this, _range).startContainer);
  }
  /**
   * `endOffset` of the current range
   *
   * @type {HTMLElement|null}
   */
  get endOffset() {
    var _a;
    return (_a = __privateGet(this, _range)) == null ? void 0 : _a.endOffset;
  }
  /**
   * Paragraph element of the `endContainer` of
   * the current range.
   *
   * @type {HTMLElement|null}
   */
  get endParagraph() {
    if (!__privateGet(this, _range)) {
      return null;
    }
    return getParagraph(__privateGet(this, _range).endContainer);
  }
  /**
   * Inline element of the `endContainer` of
   * the current range.
   *
   * @type {HTMLElement|null}
   */
  get endInline() {
    if (!__privateGet(this, _range)) {
      return null;
    }
    return getInline(__privateGet(this, _range).endContainer);
  }
  /**
   *
   *
   * @type {boolean}
   */
  get isTextSame() {
    return this.isTextFocus === this.isTextAnchor && __privateGet(this, _focusNode) === __privateGet(this, _anchorNode);
  }
  /**
   * Indicates that focus node is a text node.
   *
   * @type {boolean}
   */
  get isTextFocus() {
    return __privateGet(this, _selection).focusNode.nodeType === Node.TEXT_NODE;
  }
  /**
   * Indicates that anchor node is a text node.
   *
   * @type {boolean}
   */
  get isTextAnchor() {
    return __privateGet(this, _selection).anchorNode.nodeType === Node.TEXT_NODE;
  }
  get isInlineFocus() {
    return isInline(__privateGet(this, _focusNode));
  }
  get isInlineAnchor() {
    return isInline(__privateGet(this, _anchorNode));
  }
  get isParagraphFocus() {
    return isParagraph(__privateGet(this, _focusNode));
  }
  get isParagraphAnchor() {
    return isParagraph(__privateGet(this, _anchorNode));
  }
  /**
   * Returns true if the current focus node is a line break.
   *
   * @type {boolean}
   */
  get isLineBreakFocus() {
    return isLineBreak(__privateGet(this, _selection).focusNode) || isInline(__privateGet(this, _selection).focusNode) && isLineBreak(__privateGet(this, _selection).focusNode.firstChild);
  }
  /**
   * Indicates that we have multiple nodes selected.
   *
   * @type {boolean}
   */
  get isMulti() {
    return __privateGet(this, _selection).focusNode !== __privateGet(this, _selection).anchorNode;
  }
  /**
   * Indicates that we have selected multiple
   * paragraph elements.
   *
   * @type {boolean}
   */
  get isMultiParagraph() {
    return this.isMulti && this.focusParagraph !== this.anchorParagraph;
  }
  /**
   * Indicates that we have selected multiple
   * inline elements.
   *
   * @type {boolean}
   */
  get isMultiInline() {
    return this.isMulti && this.focusInline !== this.anchorInline;
  }
  /**
   * Indicates that the caret (only the caret)
   * is at the start of an inline.
   *
   * @type {boolean}
   */
  get isInlineStart() {
    if (!__privateGet(this, _selection).isCollapsed) return false;
    return isInlineStart(
      __privateGet(this, _selection).focusNode,
      __privateGet(this, _selection).focusOffset
    );
  }
  /**
   * Indicates that the caret (only the caret)
   * is at the end of an inline. This value doesn't
   * matter when dealing with selections.
   *
   * @type {boolean}
   */
  get isInlineEnd() {
    if (!__privateGet(this, _selection).isCollapsed) return false;
    return isInlineEnd(__privateGet(this, _selection).focusNode, __privateGet(this, _selection).focusOffset);
  }
  /**
   * Indicates that we're in the starting position of a paragraph.
   *
   * @type {boolean}
   */
  get isParagraphStart() {
    if (!__privateGet(this, _selection).isCollapsed) return false;
    return isParagraphStart(
      __privateGet(this, _selection).focusNode,
      __privateGet(this, _selection).focusOffset
    );
  }
  /**
   * Indicates that we're in the ending position of a paragraph.
   *
   * @type {boolean}
   */
  get isParagraphEnd() {
    if (!__privateGet(this, _selection).isCollapsed) return false;
    return isParagraphEnd(
      __privateGet(this, _selection).focusNode,
      __privateGet(this, _selection).focusOffset
    );
  }
  replaceLineBreak(text) {
    const newText = document.createTextNode(text);
    getInline(__privateGet(this, _focusNode)).replaceChildren(newText);
    this.collapse(newText, text.length);
  }
  removeForwardText() {
    __privateGet(this, _textNodeIterator).currentNode = __privateGet(this, _focusNode);
    const removedData = removeForward(
      __privateGet(this, _focusNode).nodeValue,
      __privateGet(this, _focusOffset)
    );
    if (__privateGet(this, _focusNode).nodeValue !== removedData) {
      __privateGet(this, _focusNode).nodeValue = removedData;
    }
    const paragraph = this.focusParagraph;
    const nextTextNode = __privateGet(this, _textNodeIterator).nextNode();
    if (__privateGet(this, _focusNode).nodeValue === "") {
      if (paragraph) __privateGet(this, _focusNode).parentElement.remove();
      this.collapse(nextTextNode, 0);
    } else {
      this.collapse(__privateGet(this, _focusNode), __privateGet(this, _focusOffset));
    }
  }
  removeBackwardText() {
    __privateGet(this, _textNodeIterator).currentNode = __privateGet(this, _focusNode);
    const removedData = removeBackward(
      __privateGet(this, _focusNode).nodeValue,
      __privateGet(this, _focusOffset)
    );
    if (__privateGet(this, _focusNode).nodeValue !== removedData) {
      __privateGet(this, _focusNode).nodeValue = removedData;
    }
    if (__privateGet(this, _focusOffset) - 1 > 0) {
      return this.collapse(__privateGet(this, _focusNode), __privateGet(this, _focusOffset) - 1);
    }
    const paragraph = this.focusParagraph;
    const inline = this.focusInline;
    const previousTextNode = __privateGet(this, _textNodeIterator).previousNode();
    if (__privateGet(this, _focusNode).nodeValue === "") {
      __privateGet(this, _focusNode).remove();
    }
    if (paragraph.children.length === 1) {
      const lineBreak = createLineBreak();
      this.focusInline.appendChild(lineBreak);
      this.collapse(lineBreak, 0);
    } else if (paragraph.children.length > 1) {
      inline.remove();
      this.collapse(previousTextNode, getTextNodeLength(previousTextNode));
    }
  }
  insertText(newText) {
    __privateGet(this, _focusNode).nodeValue = insertInto(
      __privateGet(this, _focusNode).nodeValue,
      __privateGet(this, _focusOffset),
      newText
    );
    this.collapse(__privateGet(this, _focusNode), __privateGet(this, _focusOffset) + newText.length);
    __privateGet(this, _mutations).update(this.focusInline);
  }
  replaceText(newText) {
    const startOffset = Math.min(__privateGet(this, _anchorOffset), __privateGet(this, _focusOffset));
    const endOffset = Math.max(__privateGet(this, _anchorOffset), __privateGet(this, _focusOffset));
    __privateGet(this, _focusNode).nodeValue = replaceWith(
      __privateGet(this, _focusNode).nodeValue,
      startOffset,
      endOffset,
      newText
    );
    this.collapse(__privateGet(this, _focusNode), startOffset + newText.length);
    __privateGet(this, _mutations).update(this.focusInline);
  }
  replaceInlines(newText) {
    const paragraph = this.focusParagraph;
    if (this.startInline === paragraph.firstElementChild && this.startOffset === 0 && this.endInline === paragraph.lastElementChild && this.endOffset === paragraph.lastElementChild.textContent.length) {
      const newTextNode = new Text(newText);
      paragraph.replaceChildren(
        createInline(newTextNode, __privateGet(this, _anchorNode).style)
      );
      this.collapse(newTextNode, newTextNode.nodeValue.length);
      return;
    }
    const startInline = this.startInline;
    const endInline = this.endInline;
    __privateGet(this, _range).deleteContents();
    __privateGet(this, _focusNode).nodeValue = insertInto(
      __privateGet(this, _focusNode).nodeValue,
      __privateGet(this, _focusOffset),
      newText
    );
    if (startInline.textContent === "") {
      startInline.remove();
    }
    if (endInline.textContent === "") {
      endInline.remove();
    }
    this.collapse(__privateGet(this, _focusNode), __privateGet(this, _focusOffset) + newText.length);
  }
  replaceParagraphs(newText) {
    this.focusParagraph;
    this.anchorParagraph;
  }
  insertParagraphAfter() {
    const currentParagraph = this.focusParagraph;
    const newParagraph = createEmptyParagraph(currentParagraph.style);
    currentParagraph.after(newParagraph);
    this.collapse(newParagraph.firstChild.firstChild, 0);
    __privateGet(this, _mutations).add(newParagraph);
  }
  insertParagraphBefore() {
    const currentParagraph = this.focusParagraph;
    const newParagraph = createEmptyParagraph(currentParagraph.style);
    currentParagraph.before(newParagraph);
    __privateGet(this, _mutations).add(newParagraph);
  }
  splitParagraph() {
    const newParagraph = splitParagraph(
      this.focusParagraph,
      this.focusInline,
      __privateGet(this, _focusOffset)
    );
    this.focusParagraph.after(newParagraph);
    this.collapse(newParagraph.firstChild.firstChild, 0);
    __privateGet(this, _mutations).add(newParagraph);
  }
  insertParagraph() {
    if (this.isParagraphEnd) {
      return this.insertParagraphAfter();
    } else if (this.isParagraphStart) {
      return this.insertParagraphBefore();
    }
    return this.splitParagraph();
  }
  replaceWithParagraph() {
    __privateGet(this, _range).deleteContents();
    const newParagraph = splitParagraphAtNode(
      __privateGet(this, _range).startContainer,
      __privateGet(this, _range).endOffset
    );
    this.focusParagraph.after(newParagraph);
    __privateGet(this, _mutations).add(newParagraph);
  }
  removeBackwardParagraph() {
    const previousParagraph = this.focusParagraph.previousSibling;
    if (!previousParagraph) {
      return;
    }
    const paragraphToBeRemoved = this.focusParagraph;
    paragraphToBeRemoved.remove();
    const previousInline = previousParagraph.children.length > 1 ? previousParagraph.children.item(previousParagraph.children.length - 1) : previousParagraph.firstChild;
    const previousOffset = isLineBreak(previousInline.firstChild) ? 0 : previousInline.firstChild.nodeValue.length;
    this.collapse(previousInline.firstChild, previousOffset);
    __privateGet(this, _mutations).remove();
  }
  mergeBackwardParagraph() {
    const previousParagraph = this.focusParagraph.previousElementSibling;
    if (!previousParagraph) {
      return;
    }
    let previousInline = previousParagraph.lastChild;
    const previousOffset = getInlineLength(previousInline);
    if (isEmptyParagraph(previousParagraph)) {
      previousParagraph.replaceChildren(...this.focusParagraph.children);
      this.focusParagraph.remove();
      previousInline = previousParagraph.firstChild;
    } else {
      mergeParagraphs(previousParagraph, this.focusParagraph);
    }
    this.collapse(previousInline.firstChild, previousOffset);
  }
  mergeForwardParagraph() {
    const nextParagraph = this.focusParagraph.nextElementSibling;
    if (!nextParagraph) {
      return;
    }
    mergeParagraphs(this.focusParagraph, nextParagraph);
  }
  removeSelected() {
    __privateGet(this, _textNodeIterator).currentNode = __privateGet(this, _range).startContainer;
    const affectedInlines = /* @__PURE__ */ new Set();
    const affectedParagraphs = /* @__PURE__ */ new Set();
    do {
      affectedInlines.add(getInline(__privateGet(this, _textNodeIterator).currentNode));
      affectedParagraphs.add(getParagraph(__privateGet(this, _textNodeIterator).currentNode));
      __privateGet(this, _textNodeIterator).nextNode();
    } while (__privateGet(this, _textNodeIterator).currentNode !== __privateGet(this, _range).endContainer);
    __privateGet(this, _range).deleteContents();
    for (const inline of affectedInlines) {
      if (inline.textContent === "") inline.remove();
    }
    for (const paragraph of affectedParagraphs) {
      if (paragraph.children.length === 0) paragraph.remove();
    }
  }
  applyStyles(newStyles) {
    if (!__privateGet(this, _savedSelection)) {
      return __privateMethod(this, _SelectionController_instances, applyStylesToCurrentSelection_fn).call(this, newStyles);
    }
    return __privateMethod(this, _SelectionController_instances, applyStylesToSavedSelection_fn).call(this, newStyles);
  }
}
_textEditor = new WeakMap();
_selection = new WeakMap();
_ranges = new WeakMap();
_range = new WeakMap();
_focusNode = new WeakMap();
_focusOffset = new WeakMap();
_anchorNode = new WeakMap();
_anchorOffset = new WeakMap();
_savedSelection = new WeakMap();
_textNodeIterator = new WeakMap();
_currentStyle = new WeakMap();
_inertElement = new WeakMap();
_debug = new WeakMap();
_mutations = new WeakMap();
_SelectionController_instances = new WeakSet();
/**
 * Applies some styles to the currentStyle
 * CSSStyleDeclaration
 *
 * @param {HTMLElement} element
 */
applyStylesToCurrentStyle_fn = function(element) {
  for (let index = 0; index < element.style.length; index++) {
    const styleName = element.style.item(index);
    const styleValue = element.style.getPropertyValue(styleName);
    __privateGet(this, _currentStyle).setProperty(styleName, styleValue);
  }
};
/**
 * Updates current styles based on the currently selected inline.
 *
 * @param {HTMLSpanElement} inline
 */
updateCurrentStyle_fn = function(inline) {
  const root = inline.parentElement.parentElement;
  __privateMethod(this, _SelectionController_instances, applyStylesToCurrentStyle_fn).call(this, root);
  const paragraph = inline.parentElement;
  __privateMethod(this, _SelectionController_instances, applyStylesToCurrentStyle_fn).call(this, paragraph);
  __privateMethod(this, _SelectionController_instances, applyStylesToCurrentStyle_fn).call(this, inline);
};
_onSelectionChange = new WeakMap();
/**
 * Setups
 */
setup_fn = function() {
  if (__privateGet(this, _selection).rangeCount > 0) {
    const range = __privateGet(this, _selection).getRangeAt(0);
    __privateSet(this, _range, range);
    __privateGet(this, _ranges).add(range);
  }
  if (__privateGet(this, _selection).rangeCount > 1) {
    for (let index = 1; index < __privateGet(this, _selection).rangeCount; index++) {
      __privateGet(this, _selection).removeRange(index);
    }
  }
  document.addEventListener("selectionchange", __privateGet(this, _onSelectionChange));
};
/**
 * Returns a Range-like object.
 *
 * @returns {RangeLike}
 */
getSavedRange_fn = function() {
  if (!__privateGet(this, _range)) {
    return {
      collapsed: true,
      commonAncestorContainer: null,
      startContainer: null,
      startOffset: 0,
      endContainer: null,
      endOffset: 0
    };
  }
  return {
    collapsed: __privateGet(this, _range).collapsed,
    commonAncestorContainer: __privateGet(this, _range).commonAncestorContainer,
    startContainer: __privateGet(this, _range).startContainer,
    startOffset: __privateGet(this, _range).startOffset,
    endContainer: __privateGet(this, _range).endContainer,
    endOffset: __privateGet(this, _range).endOffset
  };
};
applyStylesTo_fn = function(startNode, startOffset, endNode, endOffset, newStyles) {
  console.log(
    "applyStylesTo",
    startNode,
    startOffset,
    endNode,
    endOffset,
    newStyles
  );
  const root = __privateGet(this, _textEditor).root;
  setRootStyles(root, newStyles);
  if (startNode === endNode) {
    if (startOffset === 0 && endOffset === endNode.nodeValue.length) {
      const paragraph = getParagraph(startNode);
      const inline = getInline(startNode);
      setParagraphStyles(paragraph, newStyles);
      setInlineStyles(inline, newStyles);
    } else {
      const paragraph = getParagraph(startNode);
      setParagraphStyles(paragraph, newStyles);
      const inline = getInline(startNode);
      const midText = startNode.splitText(startOffset);
      console.log("midText", midText.nodeValue);
      const endText = midText.splitText(endOffset - startOffset);
      console.log("endText", endText.nodeValue);
      console.log("midText", midText.nodeValue);
      const midInline = createInline(midText, newStyles);
      const endInline = createInline(endText, inline.style);
      inline.after(midInline);
      midInline.after(endInline);
      this.setBaseAndExtent(midText, 0, midText, midText.nodeValue.length);
    }
    return;
  }
  __privateGet(this, _textNodeIterator).currentNode = startNode;
  do {
    getParagraph(__privateGet(this, _textNodeIterator).currentNode);
    const inline = getInline(__privateGet(this, _textNodeIterator).currentNode);
    if (__privateGet(this, _textNodeIterator).currentNode === startNode && startOffset > 0) ;
    else if (__privateGet(this, _textNodeIterator).currentNode === startNode && startOffset === 0 || __privateGet(this, _textNodeIterator).currentNode !== startNode && __privateGet(this, _textNodeIterator).currentNode !== endNode || __privateGet(this, _textNodeIterator).currentNode === endNode && endOffset === __privateGet(this, _textNodeIterator).currentNode.nodeValue.length) {
      for (const [styleName, styleValue] of Object.entries(newStyles)) {
        inline.style.setProperty(styleName, styleValue + "px");
      }
    } else if (__privateGet(this, _textNodeIterator).currentNode === endNode && endOffset < __privateGet(this, _textNodeIterator).currentNode.nodeValue.length) ;
    if (__privateGet(this, _textNodeIterator).currentNode === endNode) return;
    __privateGet(this, _textNodeIterator).nextNode();
  } while (__privateGet(this, _textNodeIterator).currentNode);
};
applyStylesToSavedSelection_fn = function(newStyles) {
  return __privateMethod(this, _SelectionController_instances, applyStylesTo_fn).call(this, __privateGet(this, _savedSelection).range.startContainer, __privateGet(this, _savedSelection).range.startOffset, __privateGet(this, _savedSelection).range.endContainer, __privateGet(this, _savedSelection).range.endOffset, newStyles);
};
applyStylesToCurrentSelection_fn = function(newStyles) {
  return __privateMethod(this, _SelectionController_instances, applyStylesTo_fn).call(this, __privateGet(this, _range).startContainer, __privateGet(this, _range).startOffset, __privateGet(this, _range).endContainer, __privateGet(this, _range).endOffset, newStyles);
};
function insertParagraph(event, editor, selectionController) {
  console.log(event.type, event.inputType);
  event.preventDefault();
  if (selectionController.isCollapsed) {
    return selectionController.insertParagraph();
  }
  return selectionController.replaceWithParagraph();
}
function insertFromPaste(event, editor, selectionController) {
  console.log(event.inputType, event.data);
  if (selectionController.isCollapsed) {
    return selectionController.insertPaste(event.data);
  }
  return selectionController.replaceWithPaste(event.data);
}
function deleteByCut(event, editor, selectionController) {
  event.preventDefault();
  if (selectionController.isCollapsed) {
    throw new Error("This should be impossible");
  }
  return selectionController.removeSelected();
}
function deleteContentBackward(event, editor, selectionController) {
  event.preventDefault();
  if (selectionController.isCollapsed) {
    if (selectionController.isTextFocus && selectionController.focusOffset > 0) {
      console.log("removeBackwardText");
      return selectionController.removeBackwardText();
    } else if (selectionController.isTextFocus && selectionController.focusAtStart) {
      console.log("mergeBackwardParagraph");
      return selectionController.mergeBackwardParagraph();
    } else if (selectionController.isInlineFocus || selectionController.isLineBreakFocus) {
      console.log("removeBackwardParagraph");
      return selectionController.removeBackwardParagraph();
    }
  }
  return selectionController.removeSelected();
}
function deleteContentForward(event, editor, selectionController) {
  event.preventDefault();
  if (selectionController.isCollapsed) {
    if (selectionController.isTextFocus && selectionController.focusOffset >= 0) {
      return selectionController.removeForwardText();
    } else if (selectionController.isTextFocus && selectionController.focusAtEnd) {
      return selectionController.mergeForwardParagraph();
    } else if ((selectionController.isInlineFocus || selectionController.isLineBreakFocus) && editor.numParagraphs > 1) {
      return selectionController.removeForwardParagraph();
    }
  }
  return selectionController.removeSelected();
}
const commands = {
  insertText,
  insertParagraph,
  insertFromPaste,
  deleteByCut,
  deleteContentBackward,
  deleteContentForward
};
class ChangeController {
  /**
   * Constructor
   *
   * @param {EventTarget} target
   * @param {number} [time=500]
   */
  constructor(target, time = 500) {
    /**
     * Keeps the timeout id.
     *
     * @type {number}
     */
    __privateAdd(this, _timeout, null);
    /**
     * Reference to the EventTarget that receives
     * the `change` events.
     *
     * @type {EventTarget}
     */
    __privateAdd(this, _target, null);
    /**
     * Keeps the time at which we're going to
     * call the debounced change calls.
     *
     * @type {number}
     */
    __privateAdd(this, _time, 1e3);
    /**
     * Keeps if we have some pending changes or not.
     *
     * @type {boolean}
     */
    __privateAdd(this, _hasPendingChanges, false);
    __privateAdd(this, _onTimeout, () => {
      __privateGet(this, _target).dispatchEvent(new Event("change"));
    });
    if (!(target instanceof EventTarget)) {
      throw new TypeError("Invalid EventTarget");
    }
    __privateSet(this, _target, target);
    if (typeof time === "number" && (!Number.isInteger(time) || time <= 0)) {
      throw new TypeError("Invalid time");
    }
    __privateSet(this, _time, time ?? 500);
  }
  /**
   * Indicates that there are some pending changes.
   *
   * @type {boolean}
   */
  get hasPendingChanges() {
    return __privateGet(this, _hasPendingChanges);
  }
  /**
   * Tells the ChangeController that a change has been made
   * but that you need to delay the notification (and debounce)
   * for sometime.
   */
  notifyDebounced() {
    __privateSet(this, _hasPendingChanges, true);
    clearTimeout(__privateGet(this, _timeout));
    __privateSet(this, _timeout, setTimeout(__privateGet(this, _onTimeout), __privateGet(this, _time)));
  }
  /**
   * Tells the ChangeController that a change should be notified
   * immediately.
   */
  notifyImmediately() {
    clearTimeout(__privateGet(this, _timeout));
    __privateGet(this, _onTimeout).call(this);
  }
  /**
   * Disposes the referenced resources.
   */
  dispose() {
    if (this.hasPendingChanges) {
      this.notifyImmediately();
    }
    clearTimeout(__privateGet(this, _timeout));
    __privateSet(this, _target, null);
  }
}
_timeout = new WeakMap();
_target = new WeakMap();
_time = new WeakMap();
_hasPendingChanges = new WeakMap();
_onTimeout = new WeakMap();
function createSelectionImposterFromClientRects(referenceRect, clientRects) {
  const fragment = document.createDocumentFragment();
  for (const rect of clientRects) {
    const rectElement = document.createElement("div");
    rectElement.className = "selection-imposter-rect";
    rectElement.style.left = `${rect.x - referenceRect.x}px`;
    rectElement.style.top = `${rect.y - referenceRect.y}px`;
    rectElement.style.width = `${rect.width}px`;
    rectElement.style.height = `${rect.height}px`;
    fragment.appendChild(rectElement);
  }
  return fragment;
}
function addEventListeners(target, object) {
  Object.entries(object).forEach(
    ([type, listener]) => target.addEventListener(type, listener)
  );
}
function removeEventListeners(target, object) {
  Object.entries(object).forEach(
    ([type, listener]) => target.removeEventListener(type, listener)
  );
}
class TextEditor extends EventTarget {
  /**
   * Constructor.
   *
   * @param {HTMLElement} element
   */
  constructor(element, options) {
    super();
    __privateAdd(this, _TextEditor_instances);
    /**
     * Element content editable to be used by the TextEditor
     *
     * @type {HTMLElement}
     */
    __privateAdd(this, _element, null);
    /**
     * Map/Dictionary of events.
     *
     * @type {Object.<string, Function>}
     */
    __privateAdd(this, _events, null);
    /**
     * Root element that will contain the content.
     *
     * @type {HTMLElement}
     */
    __privateAdd(this, _root, null);
    /**
     * Change controller controls when we should notify changes.
     *
     * @type {ChangeController}
     */
    __privateAdd(this, _changeController, null);
    /**
     * Selection controller controls the current/saved selection.
     *
     * @type {SelectionController}
     */
    __privateAdd(this, _selectionController, null);
    /**
     * Selection imposter keeps selection elements.
     *
     * @type {HTMLElement}
     */
    __privateAdd(this, _selectionImposterElement, null);
    /**
     * Style defaults.
     *
     * @type {Object.<string, *>}
     */
    __privateAdd(this, _styleDefaults, null);
    /**
     * On blur we create a new FakeSelection if there's any.
     *
     * @param {FocusEvent} e
     */
    __privateAdd(this, _onBlur, (e) => {
      var _a;
      __privateGet(this, _changeController).notifyImmediately();
      __privateGet(this, _selectionController).saveSelection();
      if (__privateGet(this, _selectionImposterElement)) {
        const rects = (_a = __privateGet(this, _selectionController).range) == null ? void 0 : _a.getClientRects();
        if (rects) {
          const rect = __privateGet(this, _selectionImposterElement).getBoundingClientRect();
          __privateGet(this, _selectionImposterElement).replaceChildren(
            createSelectionImposterFromClientRects(rect, rects)
          );
        }
      }
    });
    /**
     * On focus we should restore the FakeSelection from the current
     * selection.
     *
     * @param {FocusEvent} e
     */
    __privateAdd(this, _onFocus, (e) => {
      __privateGet(this, _selectionController).restoreSelection();
      if (__privateGet(this, _selectionImposterElement)) {
        __privateGet(this, _selectionImposterElement).replaceChildren();
      }
    });
    /**
     * Event called when the user pastes some text into the
     * editor.
     *
     * @param {ClipboardEvent} e
     */
    __privateAdd(this, _onPaste, (e) => clipboard.paste(e, this));
    __privateAdd(this, _onCut, (e) => clipboard.cut(e, this));
    __privateAdd(this, _onCopy, (e) => clipboard.copy(e, this));
    /**
     * Event called before the DOM is modified.
     *
     * @param {InputEvent} e
     */
    __privateAdd(this, _onBeforeInput, (e) => {
      if (!(e.inputType in commands)) {
        e.preventDefault();
        return;
      }
      if (e.inputType in commands) {
        const command = commands[e.inputType];
        __privateGet(this, _selectionController).startCommand();
        command(e, this, __privateGet(this, _selectionController));
        __privateGet(this, _changeController).notifyDebounced();
        const mutations = __privateGet(this, _selectionController).endCommand();
        console.log("mutations", mutations);
        __privateMethod(this, _TextEditor_instances, notifyLayout_fn).call(this, "complete", mutations);
      }
    });
    if (!(element instanceof HTMLElement))
      throw new TypeError("Invalid text editor element");
    __privateSet(this, _element, element);
    __privateSet(this, _selectionImposterElement, options == null ? void 0 : options.selectionImposterElement);
    __privateSet(this, _events, {
      blur: __privateGet(this, _onBlur),
      focus: __privateGet(this, _onFocus),
      paste: __privateGet(this, _onPaste),
      cut: __privateGet(this, _onCut),
      copy: __privateGet(this, _onCopy),
      beforeinput: __privateGet(this, _onBeforeInput)
    });
    __privateSet(this, _styleDefaults, options == null ? void 0 : options.styleDefaults);
    __privateMethod(this, _TextEditor_instances, setup_fn2).call(this, options);
  }
  /**
   * Root element that contains all the paragraphs.
   *
   * @type {HTMLDivElement}
   */
  get root() {
    return __privateGet(this, _root);
  }
  set root(newRoot) {
    const previousRoot = __privateGet(this, _root);
    __privateSet(this, _root, newRoot);
    previousRoot.replaceWith(newRoot);
  }
  /**
   * Element that contains the root and that has the
   * contenteditable attribute.
   *
   * @type {HTMLElement}
   */
  get element() {
    return __privateGet(this, _element);
  }
  /**
   * Indicates the amount of paragraphs in the current content.
   *
   * @type {number}
   */
  get numParagraphs() {
    return __privateGet(this, _root).children.length;
  }
  /**
   * Focus the element
   */
  focus() {
    return __privateGet(this, _element).focus();
  }
  /**
   * Blurs the element
   */
  blur() {
    return __privateGet(this, _element).blur();
  }
  /**
   * Creates a new root.
   *
   * @param  {...any} args
   * @returns {HTMLDivElement}
   */
  createRoot(...args) {
    return createRoot(...args);
  }
  /**
   * Creates a new paragraph.
   *
   * @param  {...any} args
   * @returns {HTMLDivElement}
   */
  createParagraph(...args) {
    return createParagraph(...args);
  }
  /**
   * Creates a new inline from a string.
   *
   * @param {string} text
   * @param {Object.<string,*>|CSSStyleDeclaration} styles
   * @returns {HTMLSpanElement}
   */
  createInlineFromString(text, styles) {
    if (text === "\n") {
      return createEmptyInline(styles);
    }
    return createInline(new Text(text), styles);
  }
  /**
   * Creates a new inline.
   *
   * @param  {...any} args
   * @returns {HTMLSpanElement}
   */
  createInline(...args) {
    return createInline(...args);
  }
  /**
   * Applies the current styles to the selection or
   * the current DOM node at the caret.
   *
   * @param {*} styles
   */
  applyStylesToSelection(styles) {
    __privateGet(this, _selectionController).applyStyles(styles);
    __privateMethod(this, _TextEditor_instances, notifyLayout_fn).call(this);
    return this;
  }
  /**
   * Selects all content.
   */
  selectAll() {
    __privateGet(this, _selectionController).selectAll();
    return this;
  }
  /**
   * Disposes everything
   */
  dispose() {
    __privateGet(this, _changeController).dispose();
    __privateGet(this, _selectionController).dispose();
    removeEventListeners(__privateGet(this, _element), __privateGet(this, _events));
    __privateSet(this, _element, null);
    __privateSet(this, _root, null);
  }
}
_element = new WeakMap();
_events = new WeakMap();
_root = new WeakMap();
_changeController = new WeakMap();
_selectionController = new WeakMap();
_selectionImposterElement = new WeakMap();
_styleDefaults = new WeakMap();
_TextEditor_instances = new WeakSet();
/**
 * Setups editor properties.
 */
setupElementProperties_fn = function() {
  if (!__privateGet(this, _element).isContentEditable) {
    __privateGet(this, _element).contentEditable = "true";
    if (!__privateGet(this, _element).isContentEditable) {
      __privateGet(this, _element).setAttribute("contenteditable", "true");
    }
  }
  if (__privateGet(this, _element).spellcheck) __privateGet(this, _element).spellcheck = false;
  if (__privateGet(this, _element).autocapitalize) __privateGet(this, _element).autocapitalize = false;
  if (!__privateGet(this, _element).autofocus) __privateGet(this, _element).autofocus = true;
  if (!__privateGet(this, _element).role || __privateGet(this, _element).role !== "textbox")
    __privateGet(this, _element).role = "textbox";
  if (__privateGet(this, _element).ariaAutoComplete) __privateGet(this, _element).ariaAutoComplete = false;
  if (!__privateGet(this, _element).ariaMultiLine) __privateGet(this, _element).ariaMultiLine = true;
  __privateGet(this, _element).dataset.itype = "editor";
};
/**
 * Setups the root element.
 */
setupRoot_fn = function() {
  __privateSet(this, _root, createEmptyRoot(__privateGet(this, _styleDefaults)));
  __privateGet(this, _element).appendChild(__privateGet(this, _root));
};
/**
 * Setups the elements, the properties and the
 * initial content.
 */
setup_fn2 = function(options) {
  __privateMethod(this, _TextEditor_instances, setupElementProperties_fn).call(this);
  __privateMethod(this, _TextEditor_instances, setupRoot_fn).call(this);
  __privateSet(this, _changeController, new ChangeController(this));
  __privateSet(this, _selectionController, new SelectionController(
    this,
    document.getSelection(),
    options
  ));
  addEventListeners(__privateGet(this, _element), __privateGet(this, _events));
};
_onBlur = new WeakMap();
_onFocus = new WeakMap();
_onPaste = new WeakMap();
_onCut = new WeakMap();
_onCopy = new WeakMap();
_onBeforeInput = new WeakMap();
/**
 * Notifies that the edited texts needs layout.
 *
 * @param {'complete'|'partial'} type
 * @param {CommandMutations} mutations
 */
notifyLayout_fn = function(type = "complete", mutations) {
  this.dispatchEvent(
    new CustomEvent("needslayout", {
      detail: {
        type,
        mutations
      }
    })
  );
};
export default TextEditor;
//# sourceMappingURL=TextEditor.js.map
