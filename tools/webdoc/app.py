# -*- coding: utf-8 -*-
"""제주도감귤농장 웹문서 생성기 — Chrome 앱 UI 진입점."""

from __future__ import annotations

from webui import find_free_port, run_chrome_app


def main() -> None:
    port = find_free_port()
    run_chrome_app(port)


if __name__ == "__main__":
    main()
