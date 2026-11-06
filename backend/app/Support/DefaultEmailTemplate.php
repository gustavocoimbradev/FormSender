<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The email every form starts with: the look of the dashboard (dark surface,
 * violet accent) written the way email clients understand it: tables, inline styles,
 * web-safe fonts, solid colors.
 */
final class DefaultEmailTemplate
{
    public const SUBJECT = 'New message: {{form_name}}';

    public const HTML = <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>{{form_name}}</title>
</head>
<body style="margin:0;padding:0;background-color:#07070d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#07070d" style="background-color:#07070d;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="padding:0 0 20px 4px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:600;color:#f4f4fb;">
              <span style="color:#8b6bff;">&#10148;</span>&nbsp; Form Sender
            </td>
          </tr>

          <tr>
            <td bgcolor="#0e0e1a" style="background-color:#0e0e1a;border:1px solid #23233a;border-radius:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:28px 28px 8px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <span style="display:inline-block;padding:4px 12px;border-radius:999px;background-color:#1d1740;color:#b7a3ff;font-size:14px;font-weight:600;">New message</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 4px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:600;color:#f4f4fb;">{{form_name}}</td>
                </tr>
                <tr>
                  <td style="padding:0 28px 20px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;color:#a3a3ba;">Received on {{date}}</td>
                </tr>
                {{#field.name}}
                <tr>
                  <td style="padding:0 28px 4px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#7e7e96;">From</td>
                </tr>
                <tr>
                  <td style="padding:0 28px 20px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;line-height:1.4;font-weight:600;color:#f4f4fb;">{{field.name}}{{#field.email}} <span style="font-weight:400;font-size:16px;color:#b7a3ff;">&lt;{{field.email}}&gt;</span>{{/field.email}}</td>
                </tr>
                {{/field.name}}
                {{#field.message}}
                <tr>
                  <td style="padding:0 28px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#14142a" style="background-color:#14142a;border-radius:14px;padding:18px 20px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#f4f4fb;">
                          <div style="font-size:14px;color:#7e7e96;padding-bottom:6px;">{{label.message}}</div>
                          {{field.message}}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                {{/field.message}}
                <tr>
                  <td style="padding:0 28px;">{{fields}}</td>
                </tr>
                {{#field.email}}
                <tr>
                  <td style="padding:24px 28px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#8b6bff" style="background-color:#8b6bff;border-radius:12px;">
                          <a href="mailto:{{field.email}}?subject=Re: {{form_name}}" style="display:inline-block;padding:14px 26px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Reply</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                {{/field.email}}
                <tr>
                  <td style="padding:20px 28px 28px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#7e7e96;">Sent from {{origin}} &middot; IP {{ip}}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 0 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#7e7e96;">Sent by Form Sender</td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}
