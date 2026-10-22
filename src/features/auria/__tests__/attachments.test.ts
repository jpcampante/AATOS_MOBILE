import {
  attachmentMarkdown,
  attachmentProblem,
  MAX_ATTACHMENT_BYTES,
  messageWithAttachments,
  resolveFile,
} from '../attachments';
import { mapApiMessage } from '../mappers';

describe('resolveFile', () => {
  it('keeps the picker name and type', () => {
    expect(resolveFile({ uri: 'file:///c/report.pdf', name: 'report.pdf', mimeType: 'application/pdf', size: 1000 })).toEqual({
      uri: 'file:///c/report.pdf',
      name: 'report.pdf',
      type: 'application/pdf',
      size: 1000,
      isImage: false,
    });
  });

  it('infers the type from the extension when the picker leaves it out', () => {
    expect(resolveFile({ uri: 'file:///cache/Camera/photo-1.jpg' })).toMatchObject({ name: 'photo-1.jpg', type: 'image/jpeg', isImage: true });
    expect(resolveFile({ uri: 'content://x', name: 'Budget.XLSX' }).type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });
});

describe('attachmentProblem', () => {
  it('accepts the backend types up to 20 MB', () => {
    expect(attachmentProblem(resolveFile({ uri: 'a.png', size: MAX_ATTACHMENT_BYTES }))).toBeNull();
    expect(attachmentProblem(resolveFile({ uri: 'notes.md' }))).toBeNull();
  });

  it('refuses files that are too large or of another type', () => {
    expect(attachmentProblem(resolveFile({ uri: 'big.pdf', size: MAX_ATTACHMENT_BYTES + 1 }))).toBe('file_too_large');
    expect(attachmentProblem(resolveFile({ uri: 'voice.m4a', mimeType: 'audio/mp4' }))).toBe('unsupported_file');
    expect(attachmentProblem(resolveFile({ uri: 'photo.heic', mimeType: 'image/heic' }))).toBe('unsupported_file');
  });
});

describe('attachment markdown', () => {
  const files = [
    { name: 'photo.jpg', url: '/auria/chat/attachments/11111111-1111-1111-1111-111111111111', isImage: true },
    { name: 'report [v2].pdf', url: '/auria/chat/attachments/22222222-2222-2222-2222-222222222222', isImage: false },
  ];

  it('writes images and files the way the web does', () => {
    expect(attachmentMarkdown(files)).toBe(
      '![photo.jpg](/auria/chat/attachments/11111111-1111-1111-1111-111111111111)\n' +
        '[attachment:report v2.pdf](/auria/chat/attachments/22222222-2222-2222-2222-222222222222)',
    );
  });

  it('puts the attachments before the question, and reads back the same', () => {
    const text = messageWithAttachments('  What is in these?  ', files);
    expect(text.endsWith('\n\nWhat is in these?')).toBe(true);
    const mapped = mapApiMessage({ uuid: 'u', author_role: 'user', content_type: 'text', content: text }, 'https://api.test');
    expect(mapped?.text).toBe('What is in these?');
    expect(mapped?.files?.map((f) => f.name)).toEqual(['photo.jpg', 'report v2.pdf']);
  });

  it('sends only the attachments when there is no text', () => {
    expect(messageWithAttachments('', files.slice(0, 1))).toBe(
      '![photo.jpg](/auria/chat/attachments/11111111-1111-1111-1111-111111111111)',
    );
  });
});
