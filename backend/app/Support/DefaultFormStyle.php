<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The look every embedded form starts with. It is meant to be read and edited (the dashboard shows it in the
 * form's Design tab), so it is plain, commented CSS. It only ever applies to the form itself: the script draws
 * the form inside a shadow tree, so it can neither be changed by the page around it nor change it, and every rule
 * lives inside one element with a very specific id, so even a copy of it elsewhere could not reach another page.
 */
final class DefaultFormStyle
{
    /**
     * The style of one form. Everything in the embedded form is found by id, and every id starts with the form's code, so
     * a page that embeds several forms (or has ids of its own) never gets them mixed up. In CSS an id cannot start with a
     * digit, so a code that does is written the way CSS asks (`\30 `).
     */
    public static function for(string $code): string
    {
        $selectorId = preg_match('/^[0-9]/', $code) === 1 ? '\\3'.$code[0].' '.substr($code, 1) : $code;

        return str_replace(['__CSSID__', '__ID__'], [$selectorId, $code], self::TEMPLATE);
    }

    private const TEMPLATE = <<<'CSS'
#__CSSID__-form {
  --text: #14141f;
  --muted: #6b6b80;
  --border: #d4d4e0;
  --field: #ffffff;
  --accent: #7c5cff;
  --accent-2: #6f8cff;
  --danger: #d93a4a;
  --ok: #1f9d63;
  font: inherit;
  color: var(--text);
  position: relative;

  form {
    display: grid;
    gap: 16px;
    margin: 0;
  }

  [id^="__ID__-field-"] {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  label {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.4;

    span {
      color: var(--accent);
      margin-left: 2px;
    }
  }

  input,
  textarea,
  select {
    width: 100%;
    min-height: 48px;
    padding: 12px 14px;
    font: inherit;
    font-size: 16px;
    color: var(--text);
    background: var(--field);
    border: 1px solid var(--border);
    border-radius: 12px;
    transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out;
    appearance: none;
    -webkit-appearance: none;

    &:hover {
      border-color: var(--muted);
    }

    &:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent);
    }

    &[aria-invalid="true"] {
      border-color: var(--danger);
    }
  }

  textarea {
    min-height: 120px;
    resize: none;
  }

  select {
    background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%);
    background-position: calc(100% - 20px) 50%, calc(100% - 15px) 50%;
    background-size: 5px 5px;
    background-repeat: no-repeat;
    padding-right: 40px;
  }

  input[type="file"] {
    padding: 8px;

    &::file-selector-button {
      font: inherit;
      font-size: 16px;
      margin-right: 12px;
      min-height: 32px;
      padding: 0 14px;
      color: var(--text);
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
    }
  }

  [id^="__ID__-check-"] {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;

    input {
      width: 24px;
      min-height: 24px;
      height: 24px;
      padding: 0;
      border-radius: 6px;
      flex: none;
      cursor: pointer;

      &:checked {
        background-color: var(--accent);
        border-color: var(--accent);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12 5 5 9-10'/%3E%3C/svg%3E");
        background-size: 16px;
        background-position: center;
        background-repeat: no-repeat;
      }
    }

    label {
      cursor: pointer;
    }
  }

  [id^="__ID__-error-"] {
    margin: 0;
    font-size: 16px;
    line-height: 1.4;
    color: var(--danger);
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    padding: 0 24px;
    font: inherit;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    background: linear-gradient(90deg, var(--accent), var(--accent-2));
    border: 0;
    border-radius: 12px;
    cursor: pointer;
    transition: filter 0.2s ease-out, opacity 0.2s ease-out;

    &:hover {
      filter: brightness(1.08);
    }

    &:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--accent) 50%, transparent);
      outline-offset: 2px;
    }

    &[disabled] {
      opacity: 0.6;
      cursor: progress;
    }
  }

  #__CSSID__-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  #__CSSID__-note {
    margin: 0;
    font-size: 16px;
    color: var(--muted);
  }

  [id^="__ID__-notice-"] {
    margin: 0;
    padding: 12px 14px;
    font-size: 16px;
    line-height: 1.4;
    text-align: center;
    color: var(--ok);
    background: color-mix(in srgb, var(--ok) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--ok) 35%, transparent);
    border-radius: 12px;

    &#__CSSID__-notice-failed {
      color: var(--danger);
      background: color-mix(in srgb, var(--danger) 10%, transparent);
      border-color: color-mix(in srgb, var(--danger) 35%, transparent);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
CSS;
}
