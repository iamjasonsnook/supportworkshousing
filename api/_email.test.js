import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail } from './_email.js';

describe('sendEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls fetch with the correct URL and params', async () => {
    const mockResponse = { ok: true, text: () => Promise.resolve('OK') };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    await sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      replyTo: 'reply@example.com',
    });

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      'https://api.emailjs.com/api/v1.0/email/send',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.template_params.to_email).toBe('test@example.com');
    expect(body.template_params.email_subject).toBe('Test Subject');
    expect(body.template_params.email_html).toBe('<p>Hello</p>');
    expect(body.template_params.reply_to).toBe('reply@example.com');
  });

  it('defaults replyTo to empty string when not provided', async () => {
    const mockResponse = { ok: true, text: () => Promise.resolve('OK') };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    await sendEmail({ to: 'a@b.com', subject: 'S', html: '<p>H</p>' });

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.template_params.reply_to).toBe('');
  });

  it('throws when the response is not ok', async () => {
    const mockResponse = { ok: false, status: 400, text: () => Promise.resolve('Bad Request') };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    await expect(
      sendEmail({ to: 'a@b.com', subject: 'S', html: '<p>H</p>' }),
    ).rejects.toThrow('EmailJS send failed (400): Bad Request');
  });
});
