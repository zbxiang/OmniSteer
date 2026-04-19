/** 使用临时 textarea + execCommand，适用于非安全上下文（如 http://局域网 IP） */
function copyViaExecCommand(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    textarea.setSelectionRange(0, text.length);
  } catch {
    // 部分环境不支持 setSelectionRange
  }
  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * 复制纯文本到剪贴板。优先使用 Clipboard API，失败或非安全上下文时回退到 execCommand。
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator.clipboard?.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 回退
    }
  }
  return copyViaExecCommand(text);
}
