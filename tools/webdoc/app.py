# -*- coding: utf-8 -*-
"""제주도감귤농장 웹문서 생성기 — 웹앱 UI 진입점 (콘솔 없음).

유아독존 SEO / 강아지교배 웹문서생성기와 동일하게:
- 로컬 Flask 웹서버
- Chrome 앱 창(또는 브라우저) 자동 실행
- --windowed exe 시 검은 콘솔 없음
"""

from __future__ import annotations

import os
import sys


def _ensure_stdio() -> None:
    """windowed(PyInstaller) 모드에서 stdout/stderr 가 None 이어도 안전."""
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w", encoding="utf-8")
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w", encoding="utf-8")


def main() -> None:
    _ensure_stdio()
    from webui import find_free_port, run_chrome_app

    port = find_free_port()
    run_chrome_app(port)


if __name__ == "__main__":
    main()
