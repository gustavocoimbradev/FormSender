#!/usr/bin/env bash
# Prints the brand line of the console scripts: a small paper plane and "Form Sender",
# in the violet-to-cyan gradient of the logo when the terminal can show it.
# Plain text when the output is not a terminal or NO_COLOR is set.

brand_title() {
    local text="➤ Form Sender"

    # Without UTF-8 the plane glyph would turn into garbage.
    case "${LC_ALL:-${LC_CTYPE:-${LANG:-}}}" in
        *UTF-8* | *utf8* | *UTF8*) ;;
        *) text=">  Form Sender" ;;
    esac

    if [ ! -t 1 ] || [ -n "${NO_COLOR:-}" ]; then
        printf '%s' "$text"
        return
    fi

    if [ "${COLORTERM:-}" = "truecolor" ] || [ "${COLORTERM:-}" = "24bit" ] || [ -n "${WT_SESSION:-}" ]; then
        # from #8b6bff to #3dd6f5, one color per character
        local length=${#text} i r g b
        printf '\033[1m'
        for ((i = 0; i < length; i++)); do
            r=$((139 + (61 - 139) * i / (length - 1)))
            g=$((107 + (214 - 107) * i / (length - 1)))
            b=$((255 + (245 - 255) * i / (length - 1)))
            printf '\033[38;2;%d;%d;%dm%s' "$r" "$g" "$b" "${text:i:1}"
        done
        printf '\033[0m'
    else
        printf '\033[1;38;5;141m%s\033[0m' "$text"
    fi
}
