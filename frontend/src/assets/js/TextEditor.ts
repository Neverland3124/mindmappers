// Code get from gojs official website with some modifications
import * as go from 'gojs';

const TextEditor: go.HTMLInfo = new go.HTMLInfo();
const textarea = document.createElement('textarea');
textarea.id = 'myTextArea';

textarea.addEventListener(
  'input',
  (e) => {
    const tool = (TextEditor as any).tool;
    if (tool.textBlock === null) return;
    const tempText = tool.measureTemporaryTextBlock(textarea.value);
    const scale = (textarea as any).textScale;
    textarea.style.width =
      20 +
      Math.max(
        tool.textBlock.measuredBounds.width,
        tempText.measuredBounds.width,
      ) *
        scale +
      'px';
    textarea.rows = Math.max(tool.textBlock.lineCount, tempText.lineCount);
  },
  false,
);

textarea.addEventListener(
  'keydown',
  (e) => {
    if (e.isComposing) return;
    const tool = (TextEditor as any).tool;
    if (tool.textBlock === null) return;
    const code = e.code;
    if (code === 'Enter') {
      // if (tool.textBlock.isMultiline === false) e.preventDefault();
      if (!e.shiftKey) tool.acceptText(go.TextEditingAccept.Tab);
      else tool.acceptText(go.TextEditingAccept.Enter);
      // if (!e.shiftKey || tool.textBlock.isMultiline === false) e.preventDefault();
      // tool.acceptText(go.TextEditingAccept.Enter);
    } else if (code === 'Tab') {
      tool.acceptText(go.TextEditingAccept.Tab);
      e.preventDefault();
    } else if (code === 'Escape') {
      // tool.doCancel();
      // if (tool.diagram !== null) tool.diagram.doFocus();
      tool.acceptText(go.TextEditingAccept.Tab);
      e.preventDefault();
    }
  },
  false,
);

textarea.addEventListener(
  'focus',
  (e) => {
    const tool = (TextEditor as any).tool;
    if (
      !tool ||
      tool.currentTextEditor === null ||
      tool.state === go.TextEditingState.None
    )
      return;

    if (tool.state === go.TextEditingState.Active) {
      tool.state = go.TextEditingState.Editing;
    }

    if (tool.selectsTextOnActivate) {
      textarea.select();
      textarea.setSelectionRange(0, 9999);
    }
  },
  false,
);

textarea.addEventListener(
  'blur',
  (e) => {
    const tool = (TextEditor as any).tool;
    if (
      !tool ||
      tool.currentTextEditor === null ||
      tool.state === go.TextEditingState.None
    )
      return;

    textarea.focus();

    if (tool.selectsTextOnActivate) {
      textarea.select();
      textarea.setSelectionRange(0, 9999);
    }
  },
  false,
);

TextEditor.valueFunction = () => textarea.value;

TextEditor.mainElement = textarea;

(TextEditor as any).tool = null;

TextEditor.show = (
  textBlock: go.GraphObject,
  diagram: go.Diagram,
  tool: go.Tool,
) => {
  if (!diagram || !diagram.div) return;
  if (!(textBlock instanceof go.TextBlock)) return;
  if ((TextEditor as any).tool !== null) return;

  (TextEditor as any).tool = tool;

  if ((tool as any).state === go.TextEditingState.Invalid) {
    textarea.style.border = '3px solid red';
    textarea.focus();
    return;
  }

  const loc = textBlock.getDocumentPoint(go.Spot.Center);
  const pos = diagram.position;
  const sc = diagram.scale;
  let textscale = textBlock.getDocumentScale() * sc;
  if (textscale < (tool as any).minimumEditorScale)
    textscale = (tool as any).minimumEditorScale;
  const textwidth = textBlock.naturalBounds.width * textscale + 6;
  const textheight = textBlock.naturalBounds.height * textscale + 2;
  const left = (loc.x - pos.x) * sc;
  const yCenter = (loc.y - pos.y) * sc;
  const valign = textBlock.verticalAlignment;
  const oneLineHeight =
    textBlock.lineHeight + textBlock.spacingAbove + textBlock.spacingBelow;
  const allLinesHeight = oneLineHeight * textBlock.lineCount * textscale;
  const center = 0.5 * textheight - 0.5 * allLinesHeight;
  const yOffset =
    valign.y * textheight -
    valign.y * allLinesHeight +
    valign.offsetY -
    center -
    allLinesHeight / 2;

  textarea.value = textBlock.text;
  diagram.div.style['font'] = textBlock.font;

  const paddingsize = 1;
  textarea.style['position'] = 'absolute';
  textarea.style['zIndex'] = '100';
  textarea.style['font'] = 'inherit';
  textarea.style['fontSize'] = textscale * 100 + '%';
  textarea.style['lineHeight'] = 'normal';
  textarea.style['width'] = textwidth + 'px';
  textarea.style['left'] = ((left - textwidth / 2) | 0) - paddingsize + 'px';
  textarea.style['top'] = ((yCenter + yOffset) | 0) - paddingsize + 'px';
  textarea.style['textAlign'] = textBlock.textAlign;
  textarea.style['margin'] = '0';
  textarea.style['padding'] = paddingsize + 'px';
  textarea.style['border'] = '0';
  textarea.style['outline'] = 'none';
  textarea.style['whiteSpace'] = 'pre-wrap';
  textarea.style['overflow'] = 'hidden';
  textarea.rows = textBlock.lineCount;
  (textarea as any).textScale = textscale;
  textarea.className = 'goTXarea';

  diagram.div.appendChild(textarea);
  textarea.focus();
  if ((tool as any).selectsTextOnActivate) {
    textarea.select();
    textarea.setSelectionRange(0, 9999);
  }
};

TextEditor.hide = (diagram: go.Diagram, tool: go.Tool) => {
  (TextEditor as any).tool = null;
  if (diagram.div) diagram.div.removeChild(textarea);
};

export { TextEditor };
