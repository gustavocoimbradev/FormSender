<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="color-scheme" content="dark">
    <meta name="theme-color" content="#07070d">
    <title>{{ $config->get('ui.title') ?? config('app.name') . ' - API Docs' }}</title>
    <link rel="icon" href="data:image/svg+xml,{{ rawurlencode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none"><defs><linearGradient id="g" x1="4" y1="20" x2="36" y2="20" gradientUnits="userSpaceOnUse"><stop stop-color="#8b6bff"/><stop offset="1" stop-color="#6f8cff"/></linearGradient></defs><path d="M35 20 7 7l8 13-8 13Z" fill="url(#g)" stroke="url(#g)" stroke-width="3" stroke-linejoin="round"/></svg>') }}">
    @include('scramble::dev-tools', ['renderer' => 'scalar'])

    {{-- The look of the dashboard: dark surfaces, violet accent, the same radius and fonts. --}}
    <style>
        :root {
            --scalar-custom-header-height: 68px;
        }

        .dark-mode,
        .light-mode {
            --scalar-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            --scalar-font-code: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            --scalar-radius: 12px;
            --scalar-radius-lg: 16px;
            --scalar-radius-xl: 24px;

            --scalar-background-1: #07070d;
            --scalar-background-2: #0e0e1a;
            --scalar-background-3: #151526;
            --scalar-background-accent: rgba(139, 107, 255, 0.12);

            --scalar-color-1: #f4f4fb;
            --scalar-color-2: #a3a3ba;
            --scalar-color-3: #7e7e96;
            --scalar-color-accent: #8b6bff;
            --scalar-border-color: rgba(255, 255, 255, 0.1);

            --scalar-sidebar-background-1: #0a0a15;
            --scalar-sidebar-color-1: #f4f4fb;
            --scalar-sidebar-color-2: #a3a3ba;
            --scalar-sidebar-border-color: rgba(255, 255, 255, 0.08);
            --scalar-sidebar-item-hover-color: #f4f4fb;
            --scalar-sidebar-item-hover-background: rgba(255, 255, 255, 0.05);
            --scalar-sidebar-item-active-background: rgba(139, 107, 255, 0.16);
            --scalar-sidebar-search-background: rgba(255, 255, 255, 0.04);
            --scalar-sidebar-search-color: #a3a3ba;
            --scalar-sidebar-search-border-color: rgba(255, 255, 255, 0.1);

            --scalar-button-1: #8b6bff;
            --scalar-button-1-color: #ffffff;
            --scalar-button-1-hover: #7b5bf0;

            --scalar-color-green: #3ddc97;
            --scalar-color-red: #ff6b81;
            --scalar-color-yellow: #ffb454;
            --scalar-color-blue: #3dd6f5;
            --scalar-color-orange: #ffb454;
            --scalar-color-purple: #8b6bff;
        }

        body {
            margin: 0;
            background: #07070d;
        }

        /* The same quiet scrollbars as the dashboard. */
        ::-webkit-scrollbar { width: 12px; height: 12px; }
        ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
        ::-webkit-scrollbar-thumb {
            border: 3px solid transparent;
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(139, 107, 255, 0.55), rgba(61, 214, 245, 0.4)) padding-box;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(139, 107, 255, 0.9), rgba(61, 214, 245, 0.75)) padding-box;
        }
        @supports not selector(::-webkit-scrollbar) {
            * { scrollbar-width: thin; scrollbar-color: rgba(139, 107, 255, 0.55) transparent; }
        }

        .fs-header {
            position: fixed;
            inset: 0 0 auto 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            height: var(--scalar-custom-header-height);
            padding: 0 24px;
            background: linear-gradient(90deg, rgba(139, 107, 255, 0.14), rgba(7, 7, 13, 0.92) 40%), #07070d;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(16px);
            font-family: var(--scalar-font, system-ui, sans-serif);
            color: #f4f4fb;
        }

        .fs-brand {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            font-size: 20px;
            font-weight: 600;
            letter-spacing: -0.01em;
            color: inherit;
            text-decoration: none;
        }

        .fs-brand svg { width: 34px; height: 34px; }

        .fs-tag {
            padding: 4px 12px;
            border-radius: 999px;
            background: rgba(139, 107, 255, 0.16);
            color: #b7a3ff;
            font-size: 16px;
            font-weight: 500;
        }

        .fs-panel {
            display: inline-flex;
            align-items: center;
            min-height: 44px;
            padding: 0 20px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 14px;
            color: #f4f4fb;
            font-size: 16px;
            font-weight: 500;
            text-decoration: none;
            transition: background-color 0.3s;
        }

        .fs-panel:hover { background: rgba(255, 255, 255, 0.06); }

        @media (max-width: 640px) {
            .fs-header { padding: 0 16px; }
            .fs-tag { display: none; }
        }
    </style>
</head>
<body>
<header class="fs-header">
    <a class="fs-brand" href="/">
        <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <defs>
                <linearGradient id="fs-gradient" x1="4" y1="20" x2="36" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#8b6bff"/>
                    <stop offset="1" stop-color="#6f8cff"/>
                </linearGradient>
            </defs>
            <path d="M35 20 7 7l8 13-8 13Z" fill="url(#fs-gradient)" stroke="url(#fs-gradient)" stroke-width="3" stroke-linejoin="round"/>
        </svg>
        FormSender
        <span class="fs-tag">API</span>
    </a>

    @if (config('app.frontend_url'))
        <a class="fs-panel" href="{{ config('app.frontend_url') }}">Open dashboard</a>
    @endif
</header>

<div id="app"></div>
<script src="{{ $config->renderer()->get('cdn', 'https://cdn.jsdelivr.net/npm/@scalar/api-reference') }}"></script>

<script>
    const CSRF_TOKEN_COOKIE_KEY = "XSRF-TOKEN";
    const CSRF_TOKEN_HEADER_KEY = "X-XSRF-TOKEN";
    const getCookieValue = (key) => {
        const cookie = document.cookie.split(';').find((cookie) => cookie.trim().startsWith(key));
        return cookie?.split("=")[1];
    };

    Scalar.createApiReference('#app', {
        content: @json($spec),
        ...@json($config->renderer()->all(except: ['cdn', 'credentials'])),
        onBeforeRequest: ({ requestBuilder }) => {
            requestBuilder.headers.set(CSRF_TOKEN_HEADER_KEY, decodeURIComponent(getCookieValue(CSRF_TOKEN_COOKIE_KEY)))
        },
        customFetch: (input, init) => {
            return window.fetch(input, { ...init, credentials: @json($config->renderer()->get('credentials', 'include')) })
        }
    })
</script>
</body>
</html>
