<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The email every new installation starts with: the look of the dashboard (dark surface,
 * violet accent) written the way email clients understand it: tables, inline styles,
 * web-safe fonts, solid colors.
 */
final class DefaultEmailTemplate
{
    public const NAME = 'Padrão';

    public const SUBJECT = 'Nova mensagem: {{form_name}}';

    public const HTML = <<<'HTML'
<!DOCTYPE html>
<html lang="pt-BR">
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
                    <span style="display:inline-block;padding:4px 12px;border-radius:999px;background-color:#1d1740;color:#b7a3ff;font-size:14px;font-weight:600;">Nova mensagem</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 4px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:600;color:#f4f4fb;">{{form_name}}</td>
                </tr>
                <tr>
                  <td style="padding:0 28px 20px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;color:#a3a3ba;">Recebida em {{date}}</td>
                </tr>
                <tr>
                  <td style="padding:0 28px;">{{fields}}</td>
                </tr>
                <tr>
                  <td style="padding:20px 28px 28px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#7e7e96;">Enviada de {{origin}} &middot; IP {{ip}}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 0 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#7e7e96;">Enviado por Form Sender</td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}
