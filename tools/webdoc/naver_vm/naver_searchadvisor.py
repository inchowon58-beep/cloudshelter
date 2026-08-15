"""네이버 서치어드바이저 웹페이지 수집 요청 (undetected-chromedriver)."""

from __future__ import annotations

import json
import logging
import random
import re
import threading
import time
import atexit
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.parse import quote, unquote, urlparse

import requests

logger = logging.getLogger(__name__)

LOGIN_ENTRY_URL = "https://searchadvisor.naver.com/"
SITE_BOARD_URL = "https://searchadvisor.naver.com/console/board"
CRAWL_PAGE_PATH = "/console/site/request/crawl"
NAVER_LOGIN_URL = (
    "https://nid.naver.com/nidlogin.login?mode=form&url="
    + quote(SITE_BOARD_URL, safe="")
)

LogFn = Callable[[str], None] | None

_driver_registry_lock = threading.Lock()
_active_drivers: list[object] = []
_uc_chrome_patched = False
_uc_orig_quit = None


def _patch_uc_chrome_lifecycle() -> None:
    """undetected_chromedriver quit/__del__ 중복 호출 WinError 6 방지."""
    global _uc_chrome_patched, _uc_orig_quit
    if _uc_chrome_patched:
        return
    try:
        import undetected_chromedriver as uc

        if getattr(uc.Chrome, "_vm_safe_lifecycle", False):
            _uc_chrome_patched = True
            return

        _uc_orig_quit = uc.Chrome.quit

        def _safe_quit(self, *_args, **_kwargs):
            if getattr(self, "_vm_quit_done", False):
                return
            self._vm_quit_done = True
            try:
                _uc_orig_quit(self)
            except (OSError, PermissionError, RuntimeError, AttributeError):
                pass
            except Exception:
                pass
            for attr in ("service", "patcher", "reactor"):
                try:
                    setattr(self, attr, None)
                except Exception:
                    pass

        uc.Chrome.quit = _safe_quit
        uc.Chrome.__del__ = lambda self: None
        uc.Chrome._vm_safe_lifecycle = True
        _uc_chrome_patched = True
    except Exception:
        pass


def _invoke_uc_quit(driver) -> None:
    """패치 전 원본 quit 1회 호출 (SafeChrome 포함)."""
    if driver is None or getattr(driver, "_vm_quit_done", False):
        return
    driver._vm_quit_done = True
    if _uc_orig_quit is None:
        _patch_uc_chrome_lifecycle()
    try:
        if _uc_orig_quit is not None:
            _uc_orig_quit(driver)
    except (OSError, PermissionError, RuntimeError, AttributeError):
        pass
    except Exception:
        pass
    for attr in ("service", "patcher", "reactor"):
        try:
            setattr(driver, attr, None)
        except Exception:
            pass


def _get_safe_chrome_class():
    """SafeChrome: 서브클래스 __del__로 GC 시 원본 __del__ 우회."""
    import undetected_chromedriver as uc

    _patch_uc_chrome_lifecycle()
    cached = getattr(uc, "_VMSafeChrome", None)
    if cached is not None:
        return cached

    class SafeChrome(uc.Chrome):
        def __del__(self):
            return

        def quit(self, *args, **kwargs):
            _invoke_uc_quit(self)

    uc._VMSafeChrome = SafeChrome
    return SafeChrome


def _track_driver(driver) -> object:
    if driver is not None:
        with _driver_registry_lock:
            if driver not in _active_drivers:
                _active_drivers.append(driver)
    return driver


def _untrack_driver(driver) -> None:
    if driver is None:
        return
    with _driver_registry_lock:
        try:
            _active_drivers.remove(driver)
        except ValueError:
            pass


def safe_quit_driver(driver, *, on_log: LogFn = None) -> None:
    """Chrome 종료 — WinError 6 / __del__ 중복 quit 방지."""
    if driver is None:
        return
    _patch_uc_chrome_lifecycle()
    try:
        quit_fn = getattr(driver, "quit", None)
        if callable(quit_fn):
            quit_fn()
        else:
            _invoke_uc_quit(driver)
    except (OSError, PermissionError, RuntimeError, AttributeError):
        pass
    except Exception as exc:
        _emit(f"  브라우저 종료: {exc}", on_log)
    _untrack_driver(driver)


def _cleanup_all_drivers() -> None:
    with _driver_registry_lock:
        pending = list(_active_drivers)
    for driver in pending:
        safe_quit_driver(driver)


_patch_uc_chrome_lifecycle()
atexit.register(_cleanup_all_drivers)


@dataclass
class LoginTypingOptions:
    """로그인 시 한 글자씩 입력할 때 글자 간 지연(초). 붙여넣기는 사용하지 않음."""
    id_min_delay: float = 0.10
    id_max_delay: float = 0.28
    pw_min_delay: float = 0.08
    pw_max_delay: float = 0.22
    page_wait_sec: float = 60.0


@dataclass
class NaverSubmitOptions:
    site_url: str
    daily_limit: int = 50
    delay_min_sec: float = 3.0
    delay_max_sec: float = 8.0
    verify_wait_sec: float = 25.0
    retry_gap_sec: float = 10.0
    between_jobs_sec: float = 25.0
    login_entry_url: str = LOGIN_ENTRY_URL
    submit_log_path: Path | None = None
    typing: LoginTypingOptions = field(default_factory=LoginTypingOptions)


@dataclass
class SubmitResult:
    url: str
    ok: bool
    message: str


@dataclass
class BatchSubmitReport:
    submitted: list[SubmitResult] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    driver: Any = None

    @property
    def success_count(self) -> int:
        return sum(1 for r in self.submitted if r.ok)

    @property
    def fail_count(self) -> int:
        return sum(1 for r in self.submitted if not r.ok)


def _emit(msg: str, on_log: LogFn) -> None:
    logger.info(msg)
    if on_log:
        on_log(msg)


def normalize_site_url(url: str) -> str:
    url = url.strip().rstrip("/")
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def _site_host(url: str) -> str:
    return urlparse(normalize_site_url(url)).netloc.lower()


def url_to_document(site_url: str, page_url: str) -> str:
    """수집 요청 입력값 — 등록 사이트 기준 전체 URL (예: https://mainecoon.cattery.co.kr/강서구메인쿤분양)."""
    site = normalize_site_url(site_url)
    site_parsed = urlparse(site)
    base = f"{site_parsed.scheme}://{site_parsed.netloc}"

    page = page_url.strip()
    if not page:
        return f"{base}/"

    if not page.startswith(("http://", "https://")):
        # mainecoon.cattery.co.kr/슬러그 처럼 scheme 없이 host/path만 있는 경우
        head = page.split("/")[0]
        if "." in head:
            page = "https://" + page.lstrip("/")
        else:
            path = page if page.startswith("/") else f"/{page}"
            return f"{base}{unquote(path)}"

    parsed = urlparse(page)
    path = unquote(parsed.path or "/")
    if not path.startswith("/"):
        path = f"/{path}"
    if parsed.query:
        path += "?" + parsed.query
    return f"{base}{path}"


def read_urls_from_file(path: Path) -> list[str]:
    if not path.exists():
        return []
    urls: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            urls.append(line)
    return urls


def _load_submit_log(path: Path) -> dict:
    if not path.exists():
        return {"days": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"days": {}}


def _save_submit_log(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _counts_toward_daily_limit(message: str) -> bool:
    """내역/로그 스킵은 실제 수집 요청이 아니므로 일일 한도에서 제외."""
    msg = str(message or "")
    skip_markers = (
        "이미 수집 요청됨",
        "이미 등록됨 (로그)",
        "내역 존재",
        "재등록 생략",
    )
    return not any(m in msg for m in skip_markers)


def get_today_submit_count(log_path: Path | None, site_url: str | None = None) -> int:
    if not log_path:
        return 0
    data = _load_submit_log(log_path)
    today = date.today().isoformat()
    day = data.get("days", {}).get(today, {})
    site_key = _submit_log_url_key(site_url) if site_url else ""
    count = 0
    for entry in day.get("entries", []):
        if not entry.get("ok"):
            continue
        if not _counts_toward_daily_limit(str(entry.get("message") or "")):
            continue
        if not site_url:
            count += 1
            continue
        entry_site = str(entry.get("site_url") or "").strip()
        if entry_site and _submit_log_url_key(entry_site) == site_key:
            count += 1
        elif not entry_site:
            page = str(entry.get("url") or "")
            if page.startswith(("http://", "https://")) and site_key in _submit_log_url_key(page):
                count += 1
    return count


def record_submit(
    log_path: Path | None,
    url: str,
    ok: bool,
    message: str,
    *,
    site_url: str | None = None,
) -> None:
    if not log_path:
        return
    data = _load_submit_log(log_path)
    today = date.today().isoformat()
    day = data.setdefault("days", {}).setdefault(
        today, {"count": 0, "entries": []}
    )
    if ok and _counts_toward_daily_limit(message):
        day["count"] = int(day.get("count", 0)) + 1
    entry = {
        "at": datetime.now(timezone.utc).isoformat(),
        "url": url,
        "ok": ok,
        "message": message,
    }
    if site_url:
        entry["site_url"] = normalize_site_url(site_url)
    day.setdefault("entries", []).append(entry)
    _save_submit_log(log_path, data)


def _submit_log_url_key(url: str) -> str:
    return normalize_site_url(url).rstrip("/").lower()


def url_already_submitted_ok(log_path: Path | None, url: str) -> bool:
    """과거 실행에서 네이버 수집 요청에 실제로 성공한 URL인지.

    '이미 수집 요청됨 (내역)' 같은 스킵/오탐 기록은 재등록 생략 대상이 아님.
    """
    if not log_path or not log_path.exists():
        return False
    key = _submit_log_url_key(url)
    data = _load_submit_log(log_path)
    for day in data.get("days", {}).values():
        for entry in day.get("entries", []):
            if not entry.get("ok"):
                continue
            if not _counts_toward_daily_limit(str(entry.get("message") or "")):
                continue
            entry_url = str(entry.get("url") or "").strip()
            if entry_url and _submit_log_url_key(entry_url) == key:
                return True
    return False


def crawl_page_url(site_url: str) -> str:
    site = normalize_site_url(site_url)
    return f"https://searchadvisor.naver.com{CRAWL_PAGE_PATH}?site={quote(site, safe='')}"


def _is_logged_in(driver) -> bool:
    """콘솔(/console/) 페이지에 실제 접속 가능한지 확인."""
    url = (driver.current_url or "").lower()
    if "nid.naver.com" in url or "nidlogin" in url:
        return False
    if "searchadvisor.naver.com" not in url:
        return False
    if "/console/" not in url:
        return False
    try:
        body = (driver.page_source or "").lower()
        if "nidlogin" in body or "sign in" in body:
            return False
        if "로그인" in body and "console/board" not in url and "request/crawl" not in url:
            return False
    except Exception:
        pass
    return True


def verify_console_login(driver, *, on_log: LogFn = None) -> bool:
    """사이트 목록(콘솔) 접근으로 로그인 여부 검증."""
    try:
        url = (driver.current_url or "").lower()
        if "searchadvisor.naver.com" in url and "nid.naver.com" not in url:
            _emit("  콘솔 새로고침 — 로그인 상태 확인", on_log)
            driver.refresh()
            time.sleep(random.uniform(2.0, 3.0))
        else:
            driver.get(SITE_BOARD_URL)
            time.sleep(random.uniform(2.0, 3.0))
        if _is_logged_in(driver):
            return True
        url = (driver.current_url or "").lower()
        if "nid.naver.com" in url or "nidlogin" in url:
            _emit("  네이버 로그인 페이지로 이동됨 — 로그인이 필요합니다.", on_log)
            return False
        _emit(f"  콘솔 접근 실패 (현재 URL: {driver.current_url})", on_log)
        return False
    except Exception as exc:
        _emit(f"  콘솔 접근 확인 오류: {exc}", on_log)
        return False


def _ensure_on_login_page(driver, *, on_log: LogFn = None) -> None:
    url = (driver.current_url or "").lower()
    if "nid.naver.com" in url and "nidlogin" in url:
        return
    _emit("  네이버 로그인 페이지로 이동", on_log)
    driver.get(NAVER_LOGIN_URL)
    time.sleep(random.uniform(2.0, 3.0))


def _wait_for_page_ready(driver, *, timeout: float = 30.0) -> None:
    from selenium.webdriver.support.ui import WebDriverWait

    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )


def _wait_before_login(
    driver,
    wait_sec: float,
    *,
    on_log: LogFn = None,
    stop_requested: Callable[[], bool] | None = None,
) -> None:
    """로그인 창이 뜬 뒤 페이지·입력창이 준비될 때까지 대기."""
    wait_sec = max(0.0, wait_sec)
    if wait_sec <= 0:
        return
    _emit(f"  로그인 페이지 준비 대기 ({wait_sec:.0f}초)…", on_log)
    remaining = float(wait_sec)
    while remaining > 0:
        if stop_requested and stop_requested():
            _emit("  중지 요청 — 로그인 대기 중단", on_log)
            raise RuntimeError("사용자 중지 요청")
        step = min(1.0, remaining)
        time.sleep(step)
        remaining -= step
        left = int(remaining)
        if left > 0 and left % 10 == 0:
            _emit(f"  … {left}초 남음", on_log)
    try:
        _wait_for_page_ready(driver, timeout=15.0)
    except Exception:
        pass


def _close_extra_windows(driver, main_handle: str | None = None, *, on_log: LogFn = None) -> None:
    """로그인 도중 열린 여분의 창/탭(아이디찾기 등)을 닫고 원래 창으로 복귀."""
    try:
        handles = driver.window_handles
    except Exception:
        return
    if not handles:
        return
    target = main_handle if main_handle in handles else handles[0]
    if len(handles) > 1:
        for handle in list(handles):
            if handle == target:
                continue
            try:
                driver.switch_to.window(handle)
                url = (driver.current_url or "").lower()
                # 로그인 진행 창은 건드리지 않음
                if "nidlogin" in url and "inquiry" not in url and "find" not in url and "join" not in url:
                    continue
                driver.close()
                _emit(f"  여분 창 닫음: {url[:80]}", on_log)
            except Exception:
                continue
    try:
        driver.switch_to.window(target)
    except Exception:
        try:
            driver.switch_to.window(driver.window_handles[0])
        except Exception:
            pass


def _switch_to_id_login_tab(driver, *, on_log: LogFn = None) -> None:
    """ID/전화번호 로그인 탭 선택 (패스키·QR 화면일 때).

    새 네이버 로그인 화면에서 '아이디 찾기'·회원가입·도움말 링크를 잘못 클릭해
    새 창이 뜨는 것을 방지한다. 아이디 입력창이 이미 보이면 아무것도 하지 않는다.
    """
    from selenium.webdriver.common.by import By

    # 아이디 입력창이 이미 노출돼 있으면 탭 전환 불필요 (오클릭 방지)
    try:
        already = driver.execute_script(
            """
            const el = document.querySelector('#id, input[name="id"]');
            return !!(el && el.offsetParent !== null);
            """
        )
        if already:
            return
    except Exception:
        pass

    _emit("  ID/전화번호 로그인 탭 확인", on_log)
    try:
        clicked = driver.execute_script(
            """
            const labels = ['id', '아이디', '전화', 'phone', 'phone number'];
            const bad = ['qr', '찾', '가입', '도움', 'help', 'join', 'find',
                         'inquiry', '비밀번호', 'sign up', '보안'];
            for (const el of document.querySelectorAll(
                '[role="tab"], .menu_id, .login_tab, button'
            )) {
                const text = (el.innerText || el.textContent || '')
                    .replace(/\\s+/g, ' ').trim().toLowerCase();
                if (!text) continue;
                if (bad.some(k => text.includes(k))) continue;
                // 새 창으로 이동하는 링크/버튼 제외
                const href = (el.getAttribute('href') || '').toLowerCase();
                const target = (el.getAttribute('target') || '').toLowerCase();
                if (target === '_blank') continue;
                if (href && (href.includes('inquiry') || href.includes('join') ||
                             href.includes('find') || href.includes('help'))) continue;
                if (labels.some(k => text.includes(k))) {
                    el.click();
                    return text;
                }
            }
            const idInput = document.querySelector('#id, input[name="id"]');
            if (idInput) return 'already-visible';
            return null;
            """
        )
        if clicked and clicked != "already-visible":
            _emit(f"  로그인 탭 선택: {clicked}", on_log)
            time.sleep(random.uniform(0.8, 1.5))
    except Exception as exc:
        _emit(f"  로그인 탭 전환 스킵: {exc}", on_log)

    # role=tab 인 안전한 탭만 클릭 (앵커 <a> 는 새 창 위험이 있어 제외)
    for xpath in (
        "//*[@role='tab' and (contains(.,'ID') or contains(.,'아이디') or contains(.,'전화'))]",
        "//button[(contains(.,'ID') or contains(.,'아이디')) and not(contains(.,'찾')) and not(contains(.,'가입'))]",
    ):
        for el in driver.find_elements(By.XPATH, xpath):
            try:
                if el.is_displayed():
                    driver.execute_script("arguments[0].click();", el)
                    time.sleep(random.uniform(0.8, 1.5))
                    return
            except Exception:
                continue


def _search_login_input_in_context(driver, field: str):
    from selenium.webdriver.common.by import By

    selectors = [
        (By.ID, field),
        (By.NAME, field),
        (By.CSS_SELECTOR, f"input#{field}"),
        (By.CSS_SELECTOR, f"input[name='{field}']"),
        (By.XPATH, f"//input[@id='{field}']"),
        (By.XPATH, f"//input[@name='{field}']"),
        (By.XPATH, f"//form[@id='frmNIDLogin']//input[@id='{field}']"),
    ]
    for by, sel in selectors:
        try:
            for el in driver.find_elements(by, sel):
                try:
                    if el.is_displayed() and el.is_enabled():
                        tag = (el.tag_name or "").lower()
                        el_type = (el.get_attribute("type") or "").lower()
                        if tag != "input":
                            continue
                        if field == "pw" and el_type not in ("password", "text", ""):
                            continue
                        if field == "id" and el_type == "password":
                            continue
                        return el
                except Exception:
                    continue
        except Exception:
            continue
    return None


def _find_naver_login_input(driver, field: str, *, on_log: LogFn = None):
    """아이디(id) 또는 비밀번호(pw) 입력창 탐색 — iframe·다중 선택자."""
    from selenium.webdriver.common.by import By

    driver.switch_to.default_content()
    _switch_to_id_login_tab(driver, on_log=on_log)

    el = _search_login_input_in_context(driver, field)
    if el:
        return el

    for iframe in driver.find_elements(By.TAG_NAME, "iframe"):
        try:
            driver.switch_to.default_content()
            driver.switch_to.frame(iframe)
            el = _search_login_input_in_context(driver, field)
            if el:
                _emit(f"  {field} 입력창 — iframe 내부에서 발견", on_log)
                return el
        except Exception:
            continue

    driver.switch_to.default_content()
    try:
        el = driver.execute_script(
            """
            const field = arguments[0];
            const selectors = [
                `#${field}`,
                `input#${field}`,
                `input[name="${field}"]`,
                field === 'pw' ? 'input[type="password"]' : 'input#id',
            ];
            for (const sel of selectors) {
                const node = document.querySelector(sel);
                if (node && node.offsetParent !== null) return node;
            }
            return null;
            """,
            field,
        )
        if el:
            _emit(f"  {field} 입력창 — JavaScript로 발견", on_log)
            return el
    except Exception:
        pass

    return None


def _wait_for_naver_login_inputs(
    driver,
    *,
    timeout: float = 30.0,
    on_log: LogFn = None,
):
    """입력창이 나타날 때까지 반복 탐색."""
    deadline = time.time() + timeout
    last_log = 0.0
    while time.time() < deadline:
        _switch_to_id_login_tab(driver, on_log=on_log if time.time() - last_log > 15 else None)
        if time.time() - last_log > 15:
            last_log = time.time()
            _emit("  아이디·비밀번호 입력창 탐색 중…", on_log)

        id_input = _find_naver_login_input(driver, "id", on_log=None)
        pw_input = _find_naver_login_input(driver, "pw", on_log=None)
        if id_input and pw_input:
            _emit("  아이디·비밀번호 입력창 확인됨", on_log)
            return id_input, pw_input
        time.sleep(1.0)

    id_input = _find_naver_login_input(driver, "id", on_log=on_log)
    pw_input = _find_naver_login_input(driver, "pw", on_log=on_log)
    if id_input and pw_input:
        return id_input, pw_input

    page_hint = (driver.current_url or "")[:120]
    raise RuntimeError(
        "네이버 로그인 입력창(id/pw)을 찾지 못했습니다.\n"
        f"현재 URL: {page_hint}\n"
        "Chrome에서 ID/전화번호 탭이 보이는지 확인해 주세요."
    )


def _focus_login_input(driver, element) -> None:
    from selenium.webdriver.common.action_chains import ActionChains

    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center'}); arguments[0].focus();",
        element,
    )
    time.sleep(random.uniform(0.2, 0.4))
    try:
        ActionChains(driver).move_to_element(element).pause(0.15).click(element).perform()
    except Exception:
        try:
            element.click()
        except Exception:
            driver.execute_script("arguments[0].click();", element)
    time.sleep(random.uniform(0.25, 0.45))


def _type_login_like_human(
    driver,
    element,
    text: str,
    *,
    min_delay: float = 0.08,
    max_delay: float = 0.24,
    on_log: LogFn = None,
) -> None:
    """붙여넣기 없이 한 글자씩 입력 (네이버 자동입력 방지 대응)."""
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.common.keys import Keys

    _focus_login_input(driver, element)

    existing = element.get_attribute("value") or ""
    if existing:
        for _ in existing:
            element.send_keys(Keys.BACKSPACE)
            time.sleep(random.uniform(0.04, 0.10))

    for ch in text:
        try:
            element.send_keys(ch)
        except Exception:
            ActionChains(driver).send_keys_to_element(element, ch).perform()
        time.sleep(random.uniform(min_delay, max_delay))

    time.sleep(random.uniform(0.15, 0.35))
    actual = (element.get_attribute("value") or "").strip()
    if actual != text.strip():
        _emit(f"  입력값 재시도 (기대 {len(text)}자, 실제 {len(actual)}자)", on_log)
        _focus_login_input(driver, element)
        for _ in range(len(actual) + 3):
            element.send_keys(Keys.BACKSPACE)
            time.sleep(0.05)
        for ch in text:
            ActionChains(driver).send_keys_to_element(element, ch).perform()
            time.sleep(random.uniform(min_delay, max_delay))
        actual = (element.get_attribute("value") or "").strip()
        if actual != text.strip():
            raise RuntimeError(
                f"입력창에 텍스트가 반영되지 않았습니다 (입력 {len(text)}자 → 확인 {len(actual)}자)."
            )


def _find_naver_login_button(driver):
    from selenium.webdriver.common.by import By

    selectors = (
        "#log\\.login",
        "button.btn_login",
        "input.btn_global[type='submit']",
        "button[type='submit']",
        "#log\\.login > span",
    )
    for selector in selectors:
        try:
            btn = driver.find_element(By.CSS_SELECTOR, selector)
            if btn.is_displayed():
                return btn
        except Exception:
            continue

    for label in ("로그인", "Login", "Sign in"):
        for btn in driver.find_elements(
            By.XPATH,
            f"//button[contains(normalize-space(.), '{label}')]",
        ):
            try:
                if btn.is_displayed() and btn.is_enabled():
                    return btn
            except Exception:
                continue
    return None


def perform_credential_login(
    driver,
    naver_id: str,
    naver_password: str,
    *,
    on_log: LogFn = None,
    typing: LoginTypingOptions | None = None,
    stop_requested: Callable[[], bool] | None = None,
) -> None:
    """네이버 로그인 폼에 아이디·비밀번호를 타이핑 후 로그인 버튼 클릭."""
    naver_id = naver_id.strip()
    naver_password = naver_password.strip()
    if not naver_id or not naver_password:
        raise ValueError("네이버 아이디와 비밀번호가 필요합니다.")

    typing = typing or LoginTypingOptions()
    _ensure_on_login_page(driver, on_log=on_log)
    _wait_before_login(
        driver, typing.page_wait_sec, on_log=on_log, stop_requested=stop_requested
    )
    if stop_requested and stop_requested():
        raise RuntimeError("사용자 중지 요청")

    try:
        main_handle = driver.current_window_handle
    except Exception:
        main_handle = None

    id_input, pw_input = _wait_for_naver_login_inputs(driver, timeout=30.0, on_log=on_log)

    _emit(
        f"  아이디 입력 중… (한 글자씩, {typing.id_min_delay:.2f}~{typing.id_max_delay:.2f}초)",
        on_log,
    )
    _type_login_like_human(
        driver,
        id_input,
        naver_id,
        min_delay=typing.id_min_delay,
        max_delay=typing.id_max_delay,
        on_log=on_log,
    )
    time.sleep(random.uniform(0.45, 0.85))

    # 아이디 입력 중 아이디찾기 등 새 창이 떴다면 닫고 원래 창으로 복귀
    _close_extra_windows(driver, main_handle, on_log=on_log)

    pw_input = _find_naver_login_input(driver, "pw", on_log=on_log) or pw_input

    _emit(
        f"  비밀번호 입력 중… (한 글자씩, {typing.pw_min_delay:.2f}~{typing.pw_max_delay:.2f}초)",
        on_log,
    )
    _type_login_like_human(
        driver,
        pw_input,
        naver_password,
        min_delay=typing.pw_min_delay,
        max_delay=typing.pw_max_delay,
        on_log=on_log,
    )
    time.sleep(random.uniform(0.55, 1.0))

    login_btn = _find_naver_login_button(driver)
    if login_btn is None:
        raise RuntimeError("네이버 로그인 버튼을 찾지 못했습니다.")

    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", login_btn)
    time.sleep(random.uniform(0.3, 0.6))
    try:
        login_btn.click()
    except Exception:
        driver.execute_script("arguments[0].click();", login_btn)
    _emit("  로그인 버튼 클릭", on_log)
    time.sleep(random.uniform(2.5, 4.0))

    # 로그인 후 남아 있는 여분 창(아이디찾기 등) 정리 후 원래 창으로
    _close_extra_windows(driver, main_handle, on_log=on_log)


def wait_for_manual_login(
    driver,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    poll_sec: float = 2.0,
    max_wait_sec: int = 900,
    prompt: bool = True,
) -> bool:
    """브라우저에서 수동 로그인 후 [로그인 완료] 확인까지 대기."""
    if on_ready_for_login:
        on_ready_for_login()

    if prompt:
        _emit(
            "Chrome에서 네이버 로그인을 완료한 뒤, "
            "프로그램 팝업 [확인]을 눌러 주세요.",
            on_log,
        )
    deadline = time.time() + max_wait_sec
    while time.time() < deadline:
        if login_confirmed and login_confirmed():
            _emit("로그인 완료 버튼 확인 — 콘솔 접근 검증 중...", on_log)
            if verify_console_login(driver, on_log=on_log):
                _emit("로그인 및 콘솔 접근 확인됨.", on_log)
                return True
            _emit(
                "아직 로그인되지 않았습니다. 브라우저에서 로그인 후 다시 [확인]을 눌러 주세요.",
                on_log,
            )
            if on_ready_for_login:
                on_ready_for_login()
            time.sleep(poll_sec)
            continue
        time.sleep(poll_sec)
    _emit("로그인 대기 시간 초과.", on_log)
    return False


def _read_chrome_version_string() -> str | None:
    """설치된 Chrome 전체 버전 (예: 131.0.6778.86)."""
    import re
    import subprocess
    import sys
    from pathlib import Path

    if sys.platform == "win32":
        try:
            import winreg

            reg_paths = [
                (winreg.HKEY_CURRENT_USER, r"Software\Google\Chrome\BLBeacon"),
                (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Google\Chrome\BLBeacon"),
                (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Wow6432Node\Google\Chrome\BLBeacon"),
            ]
            for root, subkey in reg_paths:
                try:
                    key = winreg.OpenKey(root, subkey)
                    version, _ = winreg.QueryValueEx(key, "version")
                    winreg.CloseKey(key)
                    text = str(version).strip()
                    if re.match(r"^\d+\.\d+\.\d+\.\d+$", text):
                        return text
                except OSError:
                    continue
        except ImportError:
            pass

    chrome_paths = [
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    ]
    for chrome in chrome_paths:
        if not chrome.exists():
            continue
        try:
            result = subprocess.run(
                [str(chrome), "--version"],
                capture_output=True,
                text=True,
                timeout=10,
                encoding="utf-8",
                errors="replace",
            )
            text = (result.stdout or result.stderr or "").strip()
            match = re.search(r"(\d+\.\d+\.\d+\.\d+)", text)
            if match:
                return match.group(1)
        except Exception:
            continue
    return None


def get_chrome_major_version() -> int | None:
    """설치된 Chrome major 버전 (예: 131)."""
    version = _read_chrome_version_string()
    if not version:
        return None
    try:
        major = int(version.split(".")[0])
        return major if major > 0 else None
    except ValueError:
        return None


def _build_chrome_user_agent(version: str) -> str:
    major = version.split(".")[0]
    return (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        f"Chrome/{major}.0.0.0 Safari/537.36"
    )


def _browser_version_from_driver(driver) -> str:
    try:
        caps = driver.capabilities or {}
        return str(caps.get("browserVersion") or caps.get("version") or "").strip()
    except Exception:
        return ""


def _configure_modern_browser(driver, *, on_log: LogFn = None) -> None:
    """네이버 '구형 브라우저' 경고 방지 — 실제 Chrome 버전에 맞는 UA 적용."""
    installed = _read_chrome_version_string()
    running = _browser_version_from_driver(driver)
    version = installed or running
    if not version:
        return

    ua = _build_chrome_user_agent(version)
    major = version.split(".")[0]
    try:
        driver.execute_cdp_cmd(
            "Network.setUserAgentOverride",
            {
                "userAgent": ua,
                "acceptLanguage": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "platform": "Win32",
            },
        )
    except Exception as exc:
        _emit(f"  User-Agent 설정 스킵: {exc}", on_log)

    try:
        driver.execute_cdp_cmd(
            "Emulation.setUserAgentOverride",
            {
                "userAgent": ua,
                "acceptLanguage": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "platform": "Win32",
                "userAgentMetadata": {
                    "brands": [
                        {"brand": "Google Chrome", "version": major},
                        {"brand": "Chromium", "version": major},
                        {"brand": "Not.A/Brand", "version": "24"},
                    ],
                    "fullVersionList": [
                        {"brand": "Google Chrome", "version": version},
                        {"brand": "Chromium", "version": version},
                        {"brand": "Not.A/Brand", "version": "24.0.0.0"},
                    ],
                    "fullVersion": version,
                    "platform": "Windows",
                    "platformVersion": "10.0.0",
                    "architecture": "x86",
                    "model": "",
                    "mobile": False,
                },
            },
        )
    except Exception:
        pass

    if running and installed and running.split(".")[0] != installed.split(".")[0]:
        _emit(
            f"  경고: Chrome({installed})과 드라이버({running}) major 버전이 다릅니다. "
            "Chrome을 최신으로 업데이트하거나 'pip install -U undetected-chromedriver' 를 실행하세요.",
            on_log,
        )
    else:
        _emit(f"  브라우저 버전: {running or version}", on_log)


def _parse_browser_version_from_error(exc: Exception) -> int | None:
    import re

    match = re.search(r"Current browser version is (\d+)", str(exc))
    if match:
        return int(match.group(1))
    return None


def _spawn_chrome(options, chrome_cls, kwargs: dict, *, on_log: LogFn = None):
    """Chrome 1회 기동 — 실패 시 프로세스 정리."""
    driver = None
    try:
        driver = chrome_cls(options=options, **kwargs)
        driver.set_page_load_timeout(60)
        _configure_modern_browser(driver, on_log=on_log)
        return _track_driver(driver)
    except Exception:
        if driver is not None:
            safe_quit_driver(driver, on_log=on_log)
        raise


def _create_driver(*, on_log: LogFn = None):
    import undetected_chromedriver as uc

    chrome_cls = _get_safe_chrome_class()

    installed_version = _read_chrome_version_string()
    detected = get_chrome_major_version()

    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--lang=ko-KR")
    options.add_argument("--window-size=1280,900")
    options.add_argument("--window-position=60,60")
    if installed_version:
        options.add_argument(f"--user-agent={_build_chrome_user_agent(installed_version)}")

    version_candidates: list[int | None] = []
    if detected is not None:
        version_candidates.append(detected)
    version_candidates.append(None)

    seen: set[int | None] = set()
    attempts: list[dict] = []
    for ver in version_candidates:
        if ver in seen:
            continue
        seen.add(ver)
        for use_sub in (True, False):
            kwargs: dict = {"use_subprocess": use_sub}
            if ver is not None:
                kwargs["version_main"] = ver
            attempts.append(kwargs)

    last_err: Exception | None = None
    for kwargs in attempts:
        try:
            return _spawn_chrome(options, chrome_cls, kwargs, on_log=on_log)
        except Exception as exc:
            last_err = exc
            parsed = _parse_browser_version_from_error(exc)
            if parsed is not None and parsed not in seen:
                seen.add(parsed)
                for use_sub in (True, False):
                    try:
                        return _spawn_chrome(
                            options,
                            chrome_cls,
                            {"version_main": parsed, "use_subprocess": use_sub},
                            on_log=on_log,
                        )
                    except Exception as exc2:
                        last_err = exc2
            continue

    hint = f" (설치 Chrome: {installed_version or detected})" if (installed_version or detected) else ""
    raise RuntimeError(
        f"Chrome/chromedriver 버전 불일치{hint}.\n"
        "Chrome을 최신으로 업데이트한 뒤 "
        "'pip install -U undetected-chromedriver selenium' 를 실행하고 다시 시도하세요.\n"
        f"상세: {last_err}"
    ) from last_err


def list_registered_sites(driver) -> list[str]:
    """현재 로그인된 네이버 계정의 서치어드바이저 [사이트 목록] URL."""
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait

    sites: list[str] = []
    seen: set[str] = set()

    def add_url(raw: str) -> None:
        text = raw.strip()
        if not text.startswith("http"):
            return
        norm = normalize_site_url(text)
        key = norm.lower().rstrip("/")
        if key not in seen:
            seen.add(key)
            sites.append(norm)

    try:
        WebDriverWait(driver, 15).until(
            lambda d: d.find_elements(By.CSS_SELECTOR, "tbody a.api_link, a.api_link, table a[href*='http']")
        )
    except Exception:
        pass

    selectors = (
        "tbody a.api_link",
        "a.api_link",
        "table a[href^='http']",
        ".v-data-table a[href^='http']",
    )
    for sel in selectors:
        for link in driver.find_elements(By.CSS_SELECTOR, sel):
            add_url(link.text or "")
            href = (link.get_attribute("href") or "").strip()
            if "site=" in href:
                from urllib.parse import parse_qs, urlparse, unquote

                qs = parse_qs(urlparse(href).query)
                for val in qs.get("site", []):
                    add_url(unquote(val))

    return sites


def resolve_registered_site(driver, wanted_site: str, *, on_log: LogFn = None) -> str | None:
    """사이트 목록에서 등록된 URL과 매칭 (정확한 URL 또는 동일 호스트만)."""
    wanted = normalize_site_url(wanted_site)
    wanted_host = _site_host(wanted)

    registered = list_registered_sites(driver)
    if not registered:
        return None

    for reg in registered:
        if reg == wanted:
            return reg
    for reg in registered:
        if _site_host(reg) == wanted_host:
            if reg != wanted:
                _emit(f"  동일 호스트 등록 URL 사용: {wanted} → {reg}", on_log)
            return reg

    return None


def _click_site_link(driver, registered_site: str, *, on_log: LogFn = None) -> bool:
    from selenium.webdriver.common.by import By

    target = normalize_site_url(registered_site)
    target_host = _site_host(target)
    for link in driver.find_elements(By.CSS_SELECTOR, "tbody a.api_link"):
        text = (link.text or "").strip()
        if not text.startswith("http"):
            continue
        reg = normalize_site_url(text)
        if reg == target or _site_host(reg) == target_host:
            try:
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", link)
                time.sleep(0.3)
                link.click()
                return True
            except Exception:
                try:
                    driver.execute_script("arguments[0].click();", link)
                    return True
                except Exception as exc:
                    _emit(f"  사이트 클릭 실패: {exc}", on_log)
                    return False
    return False


def _wait_for_crawl_page(driver, *, timeout: float = 25.0):
    from selenium.webdriver.support.ui import WebDriverWait

    WebDriverWait(driver, timeout).until(lambda d: _find_crawl_input(d) is not None)


def _find_crawl_input(driver):
    from selenium.webdriver.common.by import By

    def usable(el) -> bool:
        try:
            return el.is_displayed() and el.is_enabled()
        except Exception:
            return False

    # 수집 요청 페이지 전용 입력 (maxlength=2048)
    for el in driver.find_elements(By.CSS_SELECTOR, 'input[maxlength="2048"]'):
        if usable(el):
            return el

    for el in driver.find_elements(By.CSS_SELECTOR, "input[type='text']"):
        ml = (el.get_attribute("maxlength") or "").strip()
        if ml == "253":
            continue
        label = el.get_attribute("aria-label") or ""
        el_id = el.get_attribute("id") or ""
        if "검색" in label:
            continue
        if usable(el) and ml in ("2048", "2000", "1024", ""):
            return el

    for by, sel in (
        (By.XPATH, "//label[contains(.,'URL') or contains(.,'url')]/following::input[1]"),
        (By.CSS_SELECTOR, "textarea"),
    ):
        for el in driver.find_elements(by, sel):
            if usable(el):
                return el
    return None


def _find_confirm_button(driver):
    from selenium.webdriver.common.by import By

    for btn in driver.find_elements(By.CSS_SELECTOR, "button.accent, button.v-btn.accent"):
        if not btn.is_displayed() or not btn.is_enabled():
            continue
        if "확인" in (btn.text or ""):
            return btn

    for btn in driver.find_elements(
        By.XPATH,
        "//button[contains(@class,'accent')][.//span[contains(normalize-space(.),'확인')]]",
    ):
        if btn.is_displayed() and btn.is_enabled():
            return btn

    for label in ("확인", "수집 요청", "수집요청"):
        for btn in driver.find_elements(
            By.XPATH,
            f"//button[contains(normalize-space(.), '{label}')]",
        ):
            if btn.is_displayed() and btn.is_enabled():
                return btn
    return None


def _count_crawl_history_rows(driver) -> int:
    from selenium.webdriver.common.by import By

    try:
        rows = driver.find_elements(
            By.CSS_SELECTOR,
            ".v-data-table tbody tr, .v-data-table__wrapper tbody tr, table tbody tr",
        )
        return len([r for r in rows if (r.text or "").strip()])
    except Exception:
        return 0


def _document_match_variants(document: str) -> set[str]:
    """내역 매칭용 후보. 쿼리가 있으면 path만으로는 만들지 않음(product_no 오탐 방지)."""
    from urllib.parse import unquote, urlparse

    doc = unquote(document.strip())
    variants: set[str] = set()
    if not doc:
        return variants
    variants.add(doc)

    if doc.startswith(("http://", "https://")):
        parsed = urlparse(doc)
        path = unquote(parsed.path or "")
        query = parsed.query or ""
        path_q = f"{path}?{query}" if query else path
        if path_q:
            variants.add(path_q)
            variants.add(path_q.lstrip("/"))
            if not path_q.startswith("/"):
                variants.add(f"/{path_q}")
            variants.add(f"{parsed.netloc}{path_q}")
        # 쿼리 없는 URL만 path 단독 후보 허용
        if path and not query:
            variants.add(path)
            variants.add(path.lstrip("/"))
            if not path.startswith("/"):
                variants.add(f"/{path}")
            variants.add(f"{parsed.netloc}{path}")
    else:
        variants.add(doc.lstrip("/"))
        if not doc.startswith("/"):
            variants.add(f"/{doc.lstrip('/')}")
        else:
            variants.add(doc)
    return {v for v in variants if v}


def _variant_in_history_text(variant: str, text: str) -> bool:
    """부분 문자열 오탐 방지 — product_no=71 이 713 에 매칭되지 않도록."""
    if not variant or not text:
        return False
    hay = " ".join(text.split())
    needle = variant.strip()
    start = 0
    while True:
        idx = hay.find(needle, start)
        if idx < 0:
            return False
        end = idx + len(needle)
        # 뒤에 이어서 토큰이 길어지면 미매칭 (예: …=71 ⊂ …=713)
        if end < len(hay) and hay[end].isalnum():
            start = idx + 1
            continue
        return True


def _read_crawl_history_texts(driver) -> list[str]:
    """수집 요청 내역 테이블 행 텍스트."""
    from selenium.webdriver.common.by import By

    texts: list[str] = []
    try:
        rows = driver.find_elements(
            By.CSS_SELECTOR,
            ".v-data-table tbody tr, .v-data-table__wrapper tbody tr, table tbody tr",
        )
        for row in rows:
            t = (row.text or "").strip()
            if t and "등록일" not in t[:20]:
                texts.append(t.replace("\n", " "))
    except Exception:
        pass

    if texts:
        return texts

    try:
        via_js = driver.execute_script(
            """
            const out = [];
            for (const row of document.querySelectorAll(
                '.v-data-table tbody tr, table tbody tr'
            )) {
                const t = (row.innerText || '').replace(/\\s+/g, ' ').trim();
                if (t && !t.startsWith('등록일')) out.push(t);
            }
            return out;
            """
        )
        if via_js:
            return list(via_js)
    except Exception:
        pass
    return texts


def _click_crawl_submit(driver, document: str, site_url: str, *, on_log: LogFn = None) -> bool:
    """수집 URL 입력 후 [확인] 클릭 — 전체 URL 입력."""
    from selenium.webdriver.support.ui import WebDriverWait

    input_value = url_to_document(site_url, document)
    wait = WebDriverWait(driver, 20)
    try:
        inp = wait.until(lambda d: _find_crawl_input(d))
    except Exception:
        _emit("  수집 URL 입력창을 찾지 못했습니다.", on_log)
        return False

    _type_like_human(driver, inp, input_value)
    time.sleep(random.uniform(0.4, 0.9))

    btn = _find_confirm_button(driver)
    if not btn:
        _emit("  확인 버튼을 찾지 못했습니다.", on_log)
        return False
    try:
        btn.click()
    except Exception:
        driver.execute_script("arguments[0].click();", btn)
    _emit(f"  [확인] 클릭 — 입력값: {input_value}", on_log)
    return True


def _crawl_submitted_in_history(
    driver,
    document: str,
    *,
    before_count: int | None = None,
) -> bool:
    """수집 요청 내역 테이블에 URL/경로가 나타났는지 확인."""
    variants = _document_match_variants(document)
    if not variants:
        return False

    rows = _read_crawl_history_texts(driver)
    if before_count is not None and len(rows) <= before_count:
        return False

    # 긴 후보(쿼리 포함)부터 검사
    ordered = sorted(variants, key=len, reverse=True)
    for text in rows[:30]:
        if any(_variant_in_history_text(v, text) for v in ordered):
            return True
    return False


def _read_feedback(driver) -> str:
    from selenium.webdriver.common.by import By

    texts: list[str] = []
    selectors = [
        "[role='alert']",
        ".toast",
        ".alert",
        "[class*='toast']",
        "[class*='snack']",
        "[class*='Snackbar']",
    ]
    for sel in selectors:
        for el in driver.find_elements(By.CSS_SELECTOR, sel):
            try:
                if not el.is_displayed():
                    continue
                t = (el.text or "").strip()
                if t and len(t) < 500:
                    texts.append(t)
            except Exception:
                continue
    return " | ".join(texts[:3])


def _clear_input_field(driver, element) -> None:
    """Vue/Vuetify 입력창 — 기존 값 완전 삭제."""
    from selenium.webdriver.common.keys import Keys

    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
        element.click()
    except Exception:
        pass
    time.sleep(0.15)

    for _ in range(3):
        try:
            element.send_keys(Keys.CONTROL, "a")
            element.send_keys(Keys.BACKSPACE)
            element.send_keys(Keys.DELETE)
        except Exception:
            pass
        try:
            driver.execute_script(
                """
                const el = arguments[0];
                el.focus();
                const setter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                ).set;
                setter.call(el, '');
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                """,
                element,
            )
        except Exception:
            pass
        time.sleep(0.1)
        current = (element.get_attribute("value") or "").strip()
        if not current:
            return


def _fill_input_field(driver, element, text: str) -> None:
    """입력창 비운 뒤 URL 입력 (Vue 반응형 필드 대응)."""
    _clear_input_field(driver, element)
    time.sleep(0.15)

    try:
        driver.execute_script(
            """
            const el = arguments[0];
            const val = arguments[1];
            el.focus();
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            ).set;
            setter.call(el, val);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            """,
            element,
            text,
        )
    except Exception:
        element.send_keys(text)
        return

    time.sleep(0.1)
    current = element.get_attribute("value") or ""
    if current != text:
        _clear_input_field(driver, element)
        element.send_keys(text)


def _type_like_human(driver, element, text: str) -> None:
    _fill_input_field(driver, element, text)


def _url_in_crawl_history(driver, document: str) -> bool:
    return _crawl_submitted_in_history(driver, document)


def _feedback_already_registered(feedback: str) -> bool:
    if not feedback:
        return False
    words = (
        "이미 등록",
        "이미 요청",
        "이미 수집",
        "중복",
        "already",
        "duplicate",
        "등록된 url",
        "등록된 URL",
        "요청한 url",
        "요청한 URL",
    )
    lower = feedback.lower()
    return any(w.lower() in lower for w in words)


def _submit_one_url_ui(
    driver,
    document: str,
    *,
    site_url: str = "",
    on_log: LogFn = None,
    verify_wait_sec: float = 25.0,
    retry_gap_sec: float = 10.0,
    stop_requested: Callable[[], bool] | None = None,
) -> tuple[bool, str]:
    """수집 요청 1회 → 대기 → 내역 확인 (재등록 없음)."""
    del retry_gap_sec  # 재시도 비활성화
    site_url = site_url or document

    if _url_in_crawl_history(driver, document):
        _emit("  이미 [수집 요청 내역]에 있음 — 등록 생략", on_log)
        return True, "이미 수집 요청됨 (내역 존재)"

    if not _click_crawl_submit(driver, document, site_url, on_log=on_log):
        return False, "수집 요청 UI 입력/클릭 실패"

    _emit(f"  {verify_wait_sec:.0f}초 대기 후 [수집 요청 내역] 확인…", on_log)
    left = float(verify_wait_sec)
    while left > 0:
        if stop_requested and stop_requested():
            raise RuntimeError("사용자 중단 요청")
        step = min(0.5, left)
        time.sleep(step)
        left -= step

    feedback = _read_feedback(driver)
    if _feedback_already_registered(feedback):
        return True, feedback or "이미 등록됨"

    if _url_in_crawl_history(driver, document):
        return True, "수집 요청 내역에 등록됨"

    if feedback and any(w in feedback for w in ("실패", "오류", "한도", "초과", "불가")):
        return False, feedback

    return False, "수집 요청 내역에 등록되지 않음"


def _submit_one_url_api(driver, document: str, *, on_log: LogFn = None) -> tuple[bool | None, str]:
    """브라우저 세션 쿠키로 API 호출 (UI 보조). 실패 시 None 반환."""
    try:
        csrf = driver.execute_script(
            "return (window.__NUXT__ && window.__NUXT__.state && window.__NUXT__.state.csrfToken) "
            "|| (window.__NUXT__ && window.__NUXT__.state && window.__NUXT__.state.csrf) "
            "|| '';"
        )
        if not csrf:
            return None, ""

        site = driver.execute_script(
            "try { return new URL(window.location.href).searchParams.get('site') || ''; }"
            "catch(e) { return ''; }"
        )
        if not site:
            return None, ""

        payload = driver.execute_async_script(
            """
            const site = arguments[0];
            const doc = arguments[1];
            const csrf = arguments[2];
            const done = arguments[arguments.length - 1];
            fetch('/api-console/request/crawl', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json;charset=UTF-8'},
                body: JSON.stringify({site: site, document: doc, _csrf: csrf})
            })
            .then(async r => {
                const text = await r.text();
                let body = {};
                if (text) {
                    try { body = JSON.parse(text); } catch (e) { body = { raw: text }; }
                }
                return {status: r.status, body: body};
            })
            .then(done)
            .catch(e => done({status: 0, error: String(e)}));
            """,
            site,
            document,
            csrf,
        )
        if not payload:
            return None, ""
        body = payload.get("body") or {}
        if payload.get("status") == 200 and body.get("code") == 0:
            return True, body.get("message") or "SUCCESS"
        msg = body.get("message") or payload.get("error") or str(body)
        if msg and ("json" in msg.lower() or "unexpected end" in msg.lower()):
            return None, ""
        if msg:
            return False, msg
        return None, ""
    except Exception as exc:
        _emit(f"  API 보조 호출 스킵: {exc}", on_log)
        return None, ""


def _try_direct_crawl_page(driver, site_url: str, *, on_log: LogFn = None) -> str | None:
    """사이트 목록 UI 파싱 실패 시 수집 요청 URL로 직접 접근."""
    wanted = normalize_site_url(site_url)
    target = crawl_page_url(wanted)
    _emit(f"  사이트 목록에 없음 — 수집 페이지 직접 접근 시도", on_log)
    _emit(f"  URL: {target}", on_log)
    driver.get(target)
    time.sleep(random.uniform(2.5, 4.0))

    if "request/crawl" not in (driver.current_url or ""):
        driver.get(target)
        time.sleep(2.5)

    current = (driver.current_url or "").lower()
    if "nid.naver.com" in current or "nidlogin" in current:
        return None

    try:
        _wait_for_crawl_page(driver, timeout=25.0)
        _emit("  직접 URL로 수집 페이지 접근 성공", on_log)
        return wanted
    except Exception:
        return None


def navigate_to_crawl_page(driver, site_url: str, *, on_log: LogFn = None) -> str:
    """사이트 목록에서 등록 사이트를 찾아 웹페이지 수집 페이지로 이동. 실제 등록 URL 반환."""
    wanted = normalize_site_url(site_url)
    _emit(f"사이트 목록에서 '{wanted}' 검색 중...", on_log)

    driver.get(SITE_BOARD_URL)
    time.sleep(random.uniform(2.5, 3.5))

    registered = resolve_registered_site(driver, wanted, on_log=on_log)
    if not registered:
        sites = list_registered_sites(driver)
        _emit(
            f"  현재 로그인 계정의 서치어드바이저 사이트 {len(sites)}개 감지",
            on_log,
        )
        for s in sites[:10]:
            _emit(f"    • {s}", on_log)

        direct = _try_direct_crawl_page(driver, wanted, on_log=on_log)
        if direct:
            return direct

        sample = "\n".join(f"  • {s}" for s in sites[:15])
        extra = f"\n  … 외 {len(sites) - 15}개" if len(sites) > 15 else ""
        raise RuntimeError(
            f"서치어드바이저에 '{wanted}' 가 등록되어 있지 않거나,\n"
            f"현재 로그인된 네이버 계정에 해당 사이트가 없습니다.\n\n"
            f"※ 아래 목록은 프로그램 설정이 아니라, 지금 로그인한 네이버 계정의 "
            f"[사이트 목록]에서 읽어온 값입니다.\n"
            f"※ demolishzone 등록 계정과 GUI [로그인 설정] 아이디가 같은지 확인하세요.\n\n"
            f"현재 계정 사이트 목록:\n{sample}{extra}"
        )

    if registered != wanted:
        _emit(f"  사용할 등록 URL: {registered}", on_log)

    if _click_site_link(driver, registered, on_log=on_log):
        _emit("  사이트 목록에서 클릭 완료", on_log)
        time.sleep(random.uniform(1.5, 2.5))

    target = crawl_page_url(registered)
    _emit(f"  웹페이지 수집 페이지 이동", on_log)
    driver.get(target)
    time.sleep(random.uniform(2.5, 4.0))

    if "request/crawl" not in (driver.current_url or ""):
        _emit(f"  재시도: {target}", on_log)
        driver.get(target)
        time.sleep(2.5)

    try:
        _wait_for_crawl_page(driver, timeout=25.0)
    except Exception:
        current = driver.current_url or ""
        if "nid.naver.com" in current or "nidlogin" in current:
            raise RuntimeError("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.") from None
        raise RuntimeError(
            f"수집 요청 입력창(input maxlength=2048)을 찾지 못했습니다.\n"
            f"현재 URL: {current}\n"
            f"등록 사이트 URL이 정확한지 확인하세요: {registered}"
        ) from None

    _emit("  수집 요청 페이지 준비 완료.", on_log)
    return registered


def _move_browser_offscreen(driver, *, on_log: LogFn = None) -> None:
    """호환용 — 화면 밖으로 보내지 않고 화면 안에 유지."""
    _move_browser_onscreen(driver, on_log=on_log)


def _move_browser_onscreen(driver, *, on_log: LogFn = None) -> None:
    """네이버 등록용 Chrome을 화면 안(60,60)에 보이게 둔다."""
    try:
        driver.set_window_rect(x=60, y=60, width=1280, height=900)
        _emit("  Chrome 창 화면 안 표시 (60,60)", on_log)
    except Exception:
        try:
            driver.set_window_position(60, 60)
            _emit("  Chrome 창 화면 안 표시 (60,60)", on_log)
        except Exception:
            pass


def start_naver_browser(*, on_log: LogFn = None):
    """Chrome을 열고 네이버 로그인 페이지로 이동 (화면 안)."""
    _emit("Chrome 브라우저 실행 (화면 안)", on_log)
    major = get_chrome_major_version()
    if major:
        _emit(f"  감지된 Chrome 버전: {major}", on_log)
    driver = _create_driver(on_log=on_log)
    _move_browser_onscreen(driver, on_log=on_log)
    try:
        driver.switch_to.window(driver.current_window_handle)
    except Exception:
        pass
    driver.get(NAVER_LOGIN_URL)
    time.sleep(random.uniform(2.0, 3.0))
    _move_browser_onscreen(driver, on_log=on_log)
    return driver


def ensure_naver_session(
    driver,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    naver_id: str = "",
    naver_password: str = "",
    twocaptcha_api_key: str = "",
    typing: LoginTypingOptions | None = None,
) -> bool:
    """작업 재개 전 세션 확인 — 로그아웃 시 설정 아이디·비번으로 재로그인."""
    _emit("  네이버 세션 확인…", on_log)
    return prepare_naver_session(
        driver,
        on_log=on_log,
        login_confirmed=login_confirmed,
        on_ready_for_login=on_ready_for_login,
        naver_id=naver_id,
        naver_password=naver_password,
        twocaptcha_api_key=twocaptcha_api_key,
        typing=typing,
    )


def prepare_naver_session(
    driver,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    naver_id: str = "",
    naver_password: str = "",
    twocaptcha_api_key: str = "",
    typing: LoginTypingOptions | None = None,
    allow_manual_login: bool = True,
    stop_requested: Callable[[], bool] | None = None,
) -> bool:
    """기존 브라우저 세션 확인, 자동 로그인, 또는 수동 로그인 대기.

    allow_manual_login=False 이면 자동 로그인 실패 시 대기하지 않고 False 반환
    (웹문서 생성기: Chrome 종료 후 재시도용).
    """
    if stop_requested and stop_requested():
        _emit("중지 요청 — 로그인 생략", on_log)
        return False
    try:
        if verify_console_login(driver, on_log=on_log):
            _emit("네이버 로그인 세션이 유효합니다.", on_log)
            return True
    except Exception as exc:
        _emit(f"  세션 확인 중 오류: {exc}", on_log)

    user_id = naver_id.strip()
    password = naver_password.strip()
    if user_id and password:
        _emit("네이버 자동 로그인 시도…", on_log)
        try:
            _move_browser_onscreen(driver, on_log=on_log)
            perform_credential_login(
                driver,
                user_id,
                password,
                on_log=on_log,
                typing=typing,
                stop_requested=stop_requested,
            )
            _handle_captcha_if_needed(
                driver,
                twocaptcha_api_key=twocaptcha_api_key,
                on_log=on_log,
                login_confirmed=login_confirmed,
                on_ready_for_login=on_ready_for_login,
            )
            time.sleep(random.uniform(1.0, 2.0))
            if verify_console_login(driver, on_log=on_log):
                _emit("자동 로그인 완료.", on_log)
                return True
            _emit("자동 로그인 후 추가 확인이 필요합니다 (CAPTCHA·2단계 인증 등).", on_log)
        except Exception as exc:
            if stop_requested and stop_requested():
                _emit("중지 요청으로 로그인 중단", on_log)
                return False
            _emit(f"  자동 로그인 오류: {exc}", on_log)

    if not allow_manual_login:
        _emit(
            "자동 로그인 실패 — 수동 대기 없이 종료합니다. "
            "(Chrome을 닫고 재시도하거나 [오늘 미등록 웹문서 등록]을 사용하세요.)",
            on_log,
        )
        return False

    _emit("네이버 로그인이 필요합니다.", on_log)
    _ensure_on_login_page(driver, on_log=on_log)
    return wait_for_manual_login(
        driver,
        on_log=on_log,
        login_confirmed=login_confirmed,
        on_ready_for_login=on_ready_for_login,
    )


def _resolve_typing_options(
    typing: LoginTypingOptions | None,
    options: NaverSubmitOptions | None,
) -> LoginTypingOptions:
    if typing is not None:
        return typing
    if options is not None:
        return options.typing
    return LoginTypingOptions()


def _resolve_submit_batch(
    urls: list[str],
    options: NaverSubmitOptions,
    *,
    on_log: LogFn = None,
) -> tuple[list[str], list[str], BatchSubmitReport]:
    report = BatchSubmitReport()
    if not urls:
        _emit("수집 요청할 URL이 없습니다.", on_log)
        return [], [], report

    log_path = options.submit_log_path
    site = normalize_site_url(options.site_url)
    already_today = get_today_submit_count(log_path, site)
    remaining = max(0, options.daily_limit - already_today)
    if remaining <= 0:
        _emit(
            f"오늘 일일 한도({options.daily_limit}개)를 이미 사용했습니다 "
            f"(사이트: {site}). 내일 다시 시도하세요.",
            on_log,
        )
        report.skipped = list(urls)
        return [], report.skipped, report

    batch = urls[:remaining]
    if len(urls) > remaining:
        report.skipped = urls[remaining:]
        _emit(
            f"일일 한도 ({site}): 오늘 {already_today}건 사용됨 → 이번에 {len(batch)}건만 요청 "
            f"({len(report.skipped)}건 스킵)",
            on_log,
        )
    return batch, report.skipped, report


def submit_crawl_urls(
    urls: list[str],
    options: NaverSubmitOptions,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    naver_id: str = "",
    naver_password: str = "",
    twocaptcha_api_key: str = "",
    typing: LoginTypingOptions | None = None,
    stop_requested: Callable[[], bool] | None = None,
    keep_browser_open: bool = False,
    existing_driver=None,
    allow_manual_login: bool = True,
    login_retries: int = 1,
) -> BatchSubmitReport:
    """브라우저에서 수집 요청을 순차 제출. existing_driver 가 있으면 로그인 세션 재사용.

    login_retries>1 이고 owns_driver 이면 로그인 실패 시 Chrome을 닫고 다시 열어 재시도.
    """
    batch, skipped, report = _resolve_submit_batch(urls, options, on_log=on_log)
    if not batch:
        return report

    site = normalize_site_url(options.site_url)
    log_path = options.submit_log_path
    typing_opts = _resolve_typing_options(typing, options)
    driver = existing_driver
    owns_driver = driver is None
    login_ok = False
    retries = max(1, int(login_retries or 1))
    try:
        if owns_driver:
            last_err = ""
            for attempt in range(1, retries + 1):
                if stop_requested and stop_requested():
                    raise RuntimeError("사용자 중단 요청")
                if driver is not None:
                    safe_quit_driver(driver, on_log=on_log)
                    driver = None
                if attempt > 1:
                    _emit(
                        f"로그인 재시도 {attempt}/{retries} — Chrome 종료 후 새로 실행…",
                        on_log,
                    )
                    time.sleep(random.uniform(1.5, 2.5))
                driver = start_naver_browser(on_log=on_log)
                ok = prepare_naver_session(
                    driver,
                    on_log=on_log,
                    login_confirmed=login_confirmed,
                    on_ready_for_login=on_ready_for_login,
                    naver_id=naver_id,
                    naver_password=naver_password,
                    twocaptcha_api_key=twocaptcha_api_key,
                    typing=typing_opts,
                    allow_manual_login=allow_manual_login if attempt == retries else False,
                    stop_requested=stop_requested,
                )
                if ok:
                    login_ok = True
                    break
                last_err = "네이버 자동 로그인 실패"
                if attempt < retries:
                    _emit("  Chrome을 닫고 처음부터 다시 로그인합니다…", on_log)
            if not login_ok:
                raise RuntimeError(
                    last_err
                    + " — [오늘 미등록 웹문서 등록] 버튼으로 다시 시도하세요."
                )
        else:
            if not prepare_naver_session(
                driver,
                on_log=on_log,
                login_confirmed=login_confirmed,
                on_ready_for_login=on_ready_for_login,
                naver_id=naver_id,
                naver_password=naver_password,
                twocaptcha_api_key=twocaptcha_api_key,
                typing=typing_opts,
                allow_manual_login=allow_manual_login,
                stop_requested=stop_requested,
            ):
                raise RuntimeError("네이버 로그인 세션이 유효하지 않습니다.")
            login_ok = True

        active_site = navigate_to_crawl_page(driver, site, on_log=on_log)

        _emit(f"수집 요청 시작: {len(batch)}건 (사이트: {active_site})", on_log)
        for idx, page_url in enumerate(batch, start=1):
            if stop_requested and stop_requested():
                _emit("사용자 중단 요청으로 수집 요청을 멈춥니다.", on_log)
                break

            document = url_to_document(active_site, page_url)
            _emit(f"[{idx}/{len(batch)}] 수집 요청: {document}", on_log)

            if url_already_submitted_ok(log_path, page_url):
                _emit("  ⊘ 로그에 등록 완료 — 재등록 생략", on_log)
                result = SubmitResult(
                    url=page_url, ok=True, message="이미 등록됨 (로그)"
                )
                report.submitted.append(result)
                continue

            if _url_in_crawl_history(driver, document):
                _emit("  ⊘ [수집 요청 내역]에 있음 — 재등록 생략", on_log)
                result = SubmitResult(
                    url=page_url, ok=True, message="이미 수집 요청됨 (내역)"
                )
                report.submitted.append(result)
                # 실제 신규 요청이 아니므로 일일 한도 카운트/로그 누적 제외
                continue

            try:
                ok, message = _submit_one_url_ui(
                    driver,
                    document,
                    site_url=active_site,
                    on_log=on_log,
                    verify_wait_sec=options.verify_wait_sec,
                    retry_gap_sec=options.retry_gap_sec,
                    stop_requested=stop_requested,
                )
            except RuntimeError as exc:
                if "중단" in str(exc) or "중지" in str(exc):
                    _emit("사용자 중단 요청으로 수집 요청을 멈춥니다.", on_log)
                    break
                ok, message = False, str(exc)
            except Exception as exc:
                ok, message = False, str(exc)

            result = SubmitResult(url=page_url, ok=ok, message=message)
            report.submitted.append(result)
            record_submit(log_path, page_url, ok, message, site_url=active_site)

            if ok:
                _emit(f"  ✓ 성공: {message}", on_log)
            else:
                _emit(f"  ✗ 실패: {message}", on_log)
                if re.search(r"한도|limit|초과", message, re.I):
                    _emit("  일일 한도 도달로 중단합니다.", on_log)
                    break

            if idx < len(batch):
                delay = options.between_jobs_sec
                if options.between_jobs_sec <= 0:
                    delay = random.uniform(options.delay_min_sec, options.delay_max_sec)
                _emit(f"  … 다음 요청까지 {delay:.0f}초 대기", on_log)
                left = float(delay)
                while left > 0:
                    if stop_requested and stop_requested():
                        _emit("사용자 중단 요청으로 수집 요청을 멈춥니다.", on_log)
                        break
                    step = min(0.5, left)
                    time.sleep(step)
                    left -= step
                if stop_requested and stop_requested():
                    break

        _emit(
            f"수집 요청 완료: 성공 {report.success_count} / 실패 {report.fail_count}",
            on_log,
        )
        report.driver = driver
        return report
    except Exception as exc:
        _emit(f"오류 발생: {exc}", on_log)
        report.driver = driver
        raise
    finally:
        if driver and owns_driver:
            if keep_browser_open:
                report.driver = driver
            else:
                try:
                    _emit("웹문서 등록 완료 — 크롬을 종료합니다.", on_log)
                    safe_quit_driver(driver, on_log=on_log)
                except Exception:
                    pass


SITE_REGISTER_URL = "https://searchadvisor.naver.com/console/register"
NAVER_VERIFY_WAIT_SEC = 180


def _wait_for_html_tag_meta_panel(
    driver, *, timeout: float = 25.0, on_log: LogFn = None
) -> bool:
    """HTML 태그 선택 후 meta 코드 영역이 나타날 때까지 대기."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        if _is_html_tag_meta_panel_visible(driver):
            return True
        time.sleep(0.4)
    _emit("  ⚠ meta 코드 영역 표시 대기 시간 초과", on_log)
    return False


def _wait_for_verification_meta_token(
    driver, *, timeout: float = 25.0, on_log: LogFn = None
) -> str | None:
    """meta content 값이 DOM에 나타날 때까지 폴링."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        token = _extract_naver_verification_token(driver.page_source or "", driver=driver)
        if token:
            return token
        time.sleep(0.5)
    return None


def _is_html_tag_radio_selected(driver) -> bool:
    """선택된 라디오가 'HTML 태그'(파일 업로드 아님)인지 — .v-radio 단위로만 판별."""
    try:
        return bool(
            driver.execute_script(
                """
                for (const item of document.querySelectorAll('.v-radio')) {
                    const input = item.querySelector('input[type=radio]');
                    if (!input || !input.checked) continue;
                    const text = (item.innerText || '').replace(/\\s+/g, ' ').trim();
                    if (text.includes('태그') && !text.includes('업로드') && !text.includes('파일')) {
                        return true;
                    }
                }
                return false;
                """
            )
        )
    except Exception:
        return False


def _is_html_tag_meta_panel_visible(driver) -> bool:
    """HTML 태그 방식 선택 시 보이는 meta 코드 영역."""
    try:
        return bool(
            driver.execute_script(
                """
                for (const el of document.querySelectorAll('textarea, code, pre, input[readonly], .v-text-field input')) {
                    if (el.offsetParent === null) continue;
                    const v = el.value || el.innerText || el.textContent || '';
                    if (v.includes('naver-site-verification')) return true;
                }
                return false;
                """
            )
        )
    except Exception:
        return False


def _select_html_tag_method(driver, *, on_log: LogFn = None) -> bool:
    """소유확인 페이지에서 'HTML 태그' 라디오 버튼 선택 (HTML 파일 업로드 아님)."""
    from selenium.webdriver.common.by import By

    if _is_html_tag_radio_selected(driver):
        _emit("  HTML 태그 방식 이미 선택됨", on_log)
        return True

    _emit("  HTML 태그 라디오 선택 시도...", on_log)

    try:
        selected = driver.execute_script(
            """
            for (const item of document.querySelectorAll('.v-radio')) {
                const text = (item.innerText || '').replace(/\\s+/g, ' ').trim();
                if (!text.includes('태그') || text.includes('업로드') || text.includes('파일')) continue;
                const input = item.querySelector('input[type=radio]');
                item.click();
                if (input) {
                    input.click();
                    input.checked = true;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
                return true;
            }
            const radios = Array.from(document.querySelectorAll('input[type=radio]'));
            if (radios.length >= 2) {
                const r = radios[1];
                const node = r.closest('.v-radio') || r.parentElement;
                if (node) node.click();
                r.click();
                r.checked = true;
                r.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
            return false;
            """
        )
        time.sleep(1.0)
        if selected and _is_html_tag_radio_selected(driver) and _is_html_tag_meta_panel_visible(driver):
            _emit("  HTML 태그 라디오 선택 완료 (JS)", on_log)
            return True
        if selected and _is_html_tag_radio_selected(driver):
            _emit("  HTML 태그 라디오 선택됨 — meta 패널 로딩 대기", on_log)
            time.sleep(1.5)
            if _is_html_tag_meta_panel_visible(driver):
                _emit("  HTML 태그 라디오 선택 완료 (JS)", on_log)
                return True
    except Exception as exc:
        _emit(f"  HTML 태그 JS 선택 실패: {exc}", on_log)

    xpaths = (
        "//label[contains(.,'HTML') and contains(.,'태그') and not(contains(.,'업로드'))]",
        "//div[contains(@class,'v-radio')][contains(.,'HTML') and contains(.,'태그')]",
        "//*[normalize-space(.)='HTML 태그']",
    )
    for xpath in xpaths:
        for el in driver.find_elements(By.XPATH, xpath):
            try:
                if not el.is_displayed():
                    continue
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
                time.sleep(0.2)
                driver.execute_script("arguments[0].click();", el)
                time.sleep(0.6)
                if _is_html_tag_radio_selected(driver) and _is_html_tag_meta_panel_visible(driver):
                    _emit("  HTML 태그 라디오 선택 완료 (XPath)", on_log)
                    return True
            except Exception:
                continue

    _emit("  ⚠ HTML 태그 라디오 선택 실패 — HTML 파일 업로드가 선택된 상태일 수 있음", on_log)
    return False


def _click_ownership_verify_button(driver, *, on_log: LogFn = None) -> bool:
    """하단 [소유확인] 버튼 클릭 (취소·일반 확인과 구분)."""
    from selenium.webdriver.common.by import By

    def _try_click(btn, label: str) -> bool:
        try:
            if not btn.is_displayed() or not btn.is_enabled():
                return False
            text = (btn.text or "").strip()
            if "취소" in text:
                return False
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
            time.sleep(0.3)
            btn.click()
            _emit(f"  [{label}] 버튼 클릭", on_log)
            return True
        except Exception:
            try:
                driver.execute_script("arguments[0].click();", btn)
                _emit(f"  [{label}] 버튼 클릭 (JS)", on_log)
                return True
            except Exception:
                return False

    for btn in driver.find_elements(By.CSS_SELECTOR, "button.accent, button.v-btn.accent, button[type='button']"):
        text = (btn.text or "").replace(" ", "")
        if "소유확인" in text or text == "소유 확인":
            if _try_click(btn, btn.text.strip() or "소유확인"):
                return True

    for label in ("소유확인", "소유 확인"):
        for btn in driver.find_elements(
            By.XPATH,
            f"//button[contains(normalize-space(.), '{label}')]",
        ):
            if _try_click(btn, label):
                return True
    return False


def _wait_and_click_success_dialog(driver, *, timeout: float = 25.0, on_log: LogFn = None) -> bool:
    """소유확인·보안절차 완료 후 [확인] 팝업 클릭 또는 ESC."""
    return _dismiss_popup_confirm_or_esc(driver, timeout=timeout, on_log=on_log)


def _is_captcha_dialog_element(root) -> bool:
    try:
        text = root.text or ""
        return _dialog_has_captcha_keywords(text) or (
            "자동입력" in text and "보안" in text
        )
    except Exception:
        return False


def _dialog_has_captcha_keywords(text: str) -> bool:
    from naver_captcha import CAPTCHA_DIALOG_KEYWORDS

    lower = (text or "").lower()
    return any(w.lower() in lower for w in CAPTCHA_DIALOG_KEYWORDS)


def _dismiss_popup_confirm_or_esc(driver, *, timeout: float = 25.0, on_log: LogFn = None) -> bool:
    """성공/안내 팝업 [확인] 클릭, 실패 시 ESC."""
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys

    deadline = time.time() + timeout
    while time.time() < deadline:
        if _click_success_dialog_confirm(driver, on_log=on_log):
            return True

        dismissed = False
        for root_sel in ("[role='dialog']", ".v-dialog", ".v-dialog__content", ".v-overlay__content"):
            for root in driver.find_elements(By.CSS_SELECTOR, root_sel):
                try:
                    if not root.is_displayed():
                        continue
                    if _is_captcha_dialog_element(root):
                        continue
                    text = root.text or ""
                    if not text.strip():
                        continue
                    for btn in root.find_elements(By.XPATH, ".//button[contains(.,'확인')]"):
                        if btn.is_displayed() and btn.is_enabled() and "취소" not in (btn.text or ""):
                            btn.click()
                            _emit("  완료 팝업 [확인] 클릭", on_log)
                            time.sleep(1.0)
                            dismissed = True
                            break
                    if dismissed:
                        return True
                except Exception:
                    continue

        try:
            body = driver.find_element(By.TAG_NAME, "body")
            body.send_keys(Keys.ESCAPE)
            time.sleep(0.4)
            visible = False
            for root in driver.find_elements(By.CSS_SELECTOR, "[role='dialog'], .v-dialog"):
                try:
                    if root.is_displayed() and not _is_captcha_dialog_element(root):
                        visible = True
                        break
                except Exception:
                    continue
            if not visible:
                _emit("  팝업 ESC로 닫음", on_log)
                return True
        except Exception:
            pass

        time.sleep(0.5)
    return False


def _click_success_dialog_confirm(driver, *, on_log: LogFn = None) -> bool:
    """소유 확인 완료 팝업의 [확인] 클릭."""
    from selenium.webdriver.common.by import By

    for root_sel in ("[role='dialog']", ".v-dialog", ".v-dialog__content", ".v-overlay__content"):
        for root in driver.find_elements(By.CSS_SELECTOR, root_sel):
            try:
                if not root.is_displayed():
                    continue
                text = root.text or ""
                if "자동입력" in text or "보안문자" in text:
                    continue
                for btn in root.find_elements(By.XPATH, ".//button[contains(.,'확인')]"):
                    if btn.is_displayed() and btn.is_enabled():
                        label = (btn.text or "").strip()
                        if "취소" in label:
                            continue
                        btn.click()
                        _emit("  소유 확인 완료 팝업 [확인] 클릭", on_log)
                        time.sleep(1.0)
                        return True
            except Exception:
                continue

    for btn in driver.find_elements(By.XPATH, "//button[normalize-space(.)='확인']"):
        try:
            if btn.is_displayed() and btn.is_enabled():
                btn.click()
                _emit("  [확인] 클릭", on_log)
                time.sleep(1.0)
                return True
        except Exception:
            continue
    return False


def _is_on_verify_page(driver, site_url: str) -> bool:
    """현재 브라우저가 해당 사이트 소유확인 페이지인지."""
    site = normalize_site_url(site_url)
    wanted_host = _site_host(site)
    url = (driver.current_url or "").lower()
    if "verify" not in url:
        return False
    if wanted_host in url:
        return True
    encoded = quote(site, safe="").lower()
    return encoded in url.replace("%2f", "/")


def _navigate_to_verify_page(driver, site_url: str, *, on_log: LogFn = None) -> None:
    site = normalize_site_url(site_url)
    urls = [
        f"https://searchadvisor.naver.com/console/verify?site={quote(site, safe='')}",
        f"https://searchadvisor.naver.com/console/site/verify?site={quote(site, safe='')}",
    ]
    for url in urls:
        driver.get(url)
        time.sleep(random.uniform(2.5, 3.5))
        if "verify" in (driver.current_url or "").lower() or _extract_naver_verification_token(
            driver.page_source or "", driver=driver
        ):
            _emit(f"  사이트 소유확인 페이지: {driver.current_url}", on_log)
            return

    driver.get(SITE_BOARD_URL)
    time.sleep(2.5)
    if _click_site_link(driver, site, on_log=on_log):
        time.sleep(2.0)
    _click_button_by_labels(
        driver,
        ("소유 확인", "소유확인", "사이트 소유", "소유"),
        on_log=on_log,
    )
    time.sleep(2.0)


def _register_site_from_board(
    driver,
    site_url: str,
    *,
    on_log: LogFn = None,
) -> None:
    """웹마스터 도구 사이트 목록(board)에서 URL 등록."""
    site = normalize_site_url(site_url)
    _emit(f"  사이트 목록(board)에서 등록: {site}", on_log)
    driver.get(SITE_BOARD_URL)
    time.sleep(random.uniform(2.5, 3.5))

    clicked = _click_button_by_labels(
        driver,
        ("사이트 등록", "URL 등록", "사이트 추가", "등록"),
        on_log=on_log,
    )
    if clicked:
        time.sleep(1.5)

    if not _fill_site_url_input(driver, site):
        raise RuntimeError(
            "사이트 URL 입력란을 찾지 못했습니다.\n"
            f"https://searchadvisor.naver.com/console/board 에서 직접 URL을 입력해 주세요."
        )

    _click_button_by_labels(
        driver,
        ("등록", "다음", "확인", "시작", "추가"),
        on_log=on_log,
    )
    time.sleep(random.uniform(2.5, 3.5))


def _handle_captcha_if_needed(
    driver,
    *,
    twocaptcha_api_key: str = "",
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    wait_for_modal: bool = False,
) -> bool:
    from naver_captcha import (
        OwnershipVerifyFailedError,
        captcha_modal_visible,
        has_captcha_solver,
        refresh_captcha_image,
        solve_naver_captcha_modal,
        wait_and_solve_naver_captcha_modal,
    )

    if wait_for_modal:
        if has_captcha_solver(twocaptcha_api_key):
            try:
                solved = wait_and_solve_naver_captcha_modal(
                    driver,
                    twocaptcha_api_key=twocaptcha_api_key,
                    on_log=on_log,
                    max_attempts=5,
                )
            except OwnershipVerifyFailedError:
                return False
            if solved:
                return True
        elif not captcha_modal_visible(driver):
            return True
        else:
            _emit("  ⚠ 2Captcha API 키가 필요합니다.", on_log)
        _emit(
            "  CAPTCHA 자동 처리 실패 — 브라우저에서 직접 입력 후 프로그램 [확인]을 눌러 주세요.",
            on_log,
        )
        if on_ready_for_login:
            on_ready_for_login()
        if login_confirmed:
            deadline = time.time() + 300
            while time.time() < deadline:
                if login_confirmed():
                    return True
                time.sleep(1.0)
        return False
    elif not captcha_modal_visible(driver) and not _needs_captcha(driver.page_source or ""):
        return True

    _emit("  자동입력 방지(CAPTCHA) 감지", on_log)
    if has_captcha_solver(twocaptcha_api_key):
        for attempt in range(3):
            if solve_naver_captcha_modal(
                driver,
                twocaptcha_api_key=twocaptcha_api_key,
                on_log=on_log,
            ):
                time.sleep(1.5)
                if not captcha_modal_visible(driver):
                    _emit("  CAPTCHA 자동 입력 완료", on_log)
                    return True
            if attempt < 2:
                _emit(f"  CAPTCHA 재시도 ({attempt + 2}/3)", on_log)
                refresh_captcha_image(driver, on_log=on_log)
                time.sleep(1.5)

    _emit(
        "  CAPTCHA 자동 처리 실패 — 브라우저에서 직접 입력 후 프로그램 [확인]을 눌러 주세요.",
        on_log,
    )
    if on_ready_for_login:
        on_ready_for_login()
    if login_confirmed:
        deadline = time.time() + 300
        while time.time() < deadline:
            if login_confirmed():
                return True
            time.sleep(1.0)
    return False


def _extract_verification_content_from_dom(driver) -> str | None:
    """화면에 표시된 meta 태그/textarea에서 content 값만 추출."""
    try:
        token = driver.execute_script(
            """
            const pick = (text) => {
                if (!text) return null;
                let m = text.match(/content=["']([^"']+)["']/i);
                if (m && m[1]) return m[1];
                m = text.match(/naver-site-verification[^>]*content=["']([^"']+)["']/i);
                if (m && m[1]) return m[1];
                return null;
            };
            const html = document.documentElement.innerHTML || '';
            const fromHtml = pick(html);
            if (fromHtml) return fromHtml;
            for (const el of document.querySelectorAll(
                'textarea, code, pre, input, .v-field, .v-input, [class*="code"], [class*="snippet"]'
            )) {
                const v = el.value || el.innerText || el.textContent || '';
                if (!v.includes('naver-site-verification')) continue;
                const t = pick(v);
                if (t) return t;
            }
            const bodyText = document.body.innerText || '';
            if (bodyText.includes('naver-site-verification')) {
                const t = pick(bodyText);
                if (t) return t;
            }
            return null;
            """
        )
        if token and len(str(token).strip()) >= 16:
            return str(token).strip()
    except Exception:
        pass
    return None


def site_html_contains_meta(
    site_url: str,
    meta_content: str,
    *,
    on_log: LogFn = None,
) -> bool:
    """사이트 HTML에 naver-site-verification meta(content) 가 있는지 확인."""
    url = normalize_site_url(site_url)
    expected = (meta_content or "").strip()
    if not expected:
        return False

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=20, allow_redirects=True)
        resp.raise_for_status()
        html = resp.text or ""
    except Exception as exc:
        _emit(f"  메타 확인 HTTP 실패 ({url}): {exc}", on_log)
        return False

    found = _extract_naver_verification_token(html)
    if found and found == expected:
        _emit(f"  메타 태그 일치 확인: {found[:12]}…", on_log)
        return True

    if expected in html and "naver-site-verification" in html.lower():
        _emit(f"  메타 태그 문자열 확인: {expected[:12]}…", on_log)
        return True

    _emit("  메타 태그 미발견", on_log)
    return False


def wait_for_meta_deployed(
    site_url: str,
    meta_content: str,
    *,
    initial_wait_sec: float = 60.0,
    poll_interval_sec: float = 30.0,
    max_poll_sec: float = 240.0,
    stability_checks: int = 2,
    post_ready_wait_sec: float = 20.0,
    on_log: LogFn = None,
) -> bool:
    """submit-meta 후 사이트 HTML에 메타 태그가 나타날 때까지 확인 → 안정화 후 True."""
    site = normalize_site_url(site_url)
    if initial_wait_sec > 0:
        _emit(
            f"  메타 반영 대기 — {initial_wait_sec:.0f}초 후 확인 시작 ({site})",
            on_log,
        )
        time.sleep(initial_wait_sec)
    else:
        _emit(f"  사이트 메타 태그 확인 시작 ({site})", on_log)

    deadline = time.time() + max(0.0, max_poll_sec)
    attempt = 0
    stable_hits = 0
    need_stable = max(1, int(stability_checks))
    while True:
        attempt += 1
        _emit(f"  사이트 메타 확인 ({attempt}회)", on_log)
        if site_html_contains_meta(site, meta_content, on_log=on_log):
            stable_hits += 1
            if stable_hits >= need_stable:
                if post_ready_wait_sec > 0:
                    _emit(
                        f"  메타 {need_stable}회 연속 확인 — "
                        f"네이버 반영 대기 {post_ready_wait_sec:.0f}초",
                        on_log,
                    )
                    time.sleep(post_ready_wait_sec)
                _emit("  ✓ 사이트 HTML에 메타 태그 확인 — 소유확인 진행", on_log)
                return True
            remaining = deadline - time.time()
            if remaining <= 0:
                break
            wait = min(poll_interval_sec, remaining)
            _emit(
                f"  메타 확인 ({stable_hits}/{need_stable}) — {wait:.0f}초 후 재확인",
                on_log,
            )
            time.sleep(wait)
            continue

        stable_hits = 0
        remaining = deadline - time.time()
        if remaining <= 0:
            break
        wait = min(poll_interval_sec, remaining)
        _emit(f"  메타 미반영 — {wait:.0f}초 후 재확인", on_log)
        time.sleep(wait)

    _emit("  ✗ 메타 태그 반영 확인 시간 초과", on_log)
    return False


def _extract_naver_verification_token(page_source: str, driver=None) -> str | None:
    """meta content 값만 반환 (태그 전체 X)."""
    if driver is not None:
        dom_token = _extract_verification_content_from_dom(driver)
        if dom_token:
            return dom_token

    patterns = [
        r'name="naver-site-verification"\s+content="([^"]+)"',
        r"content=\"([^\"]+)\"\s+name=\"naver-site-verification\"",
        r'name=\"naver-site-verification\"\s+content=\'([^\']+)\'',
        r'"naver-site-verification"\s*:\s*"([^"]+)"',
        r"naver-site-verification[^>]*content=[\"']([^\"']+)[\"']",
    ]
    for pattern in patterns:
        match = re.search(pattern, page_source, re.I)
        if match:
            token = match.group(1).strip()
            if token and token not in ("PENDING", "..."):
                return token
    return None


def _click_button_by_labels(driver, labels: tuple[str, ...], *, on_log: LogFn = None) -> bool:
    from selenium.webdriver.common.by import By

    for label in labels:
        for btn in driver.find_elements(
            By.XPATH,
            f"//button[contains(normalize-space(.), '{label}')]",
        ):
            try:
                if btn.is_displayed() and btn.is_enabled():
                    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
                    time.sleep(0.3)
                    btn.click()
                    return True
            except Exception:
                try:
                    driver.execute_script("arguments[0].click();", btn)
                    return True
                except Exception as exc:
                    _emit(f"  버튼 클릭 실패 ({label}): {exc}", on_log)
    for label in labels:
        for el in driver.find_elements(By.CSS_SELECTOR, "button.accent, a.accent, button.v-btn.accent"):
            if label in (el.text or "") and el.is_displayed():
                try:
                    el.click()
                    return True
                except Exception:
                    pass
    return False


def _fill_site_url_input(driver, site_url: str) -> bool:
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys

    site = normalize_site_url(site_url)
    selectors = [
        'input[type="url"]',
        'input[placeholder*="http"]',
        'input[maxlength="2048"]',
        'input[maxlength="253"]',
        "input[type='text']",
    ]
    for sel in selectors:
        for el in driver.find_elements(By.CSS_SELECTOR, sel):
            try:
                if not el.is_displayed() or not el.is_enabled():
                    continue
                aria = el.get_attribute("aria-label") or ""
                if "검색" in aria:
                    continue
                el.click()
                el.send_keys(Keys.CONTROL, "a")
                el.send_keys(Keys.DELETE)
                el.send_keys(site)
                return True
            except Exception:
                continue
    return False


def _needs_captcha(page_source: str) -> bool:
    lower = page_source.lower()
    return any(
        w in lower
        for w in (
            "자동입력 방지",
            "자동입력방지",
            "보안절차",
            "보안 절차",
            "captcha",
            "보안문자",
            "보안코드",
            "anti-spam",
        )
    )


def register_site_and_get_verification_token(
    driver,
    site_url: str,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    naver_id: str = "",
    naver_password: str = "",
    twocaptcha_api_key: str = "",
    skip_captcha: bool = False,
) -> str:
    """board → 사이트 등록 → 소유확인 → HTML 태그 → meta token."""
    site = normalize_site_url(site_url)
    _emit(f"네이버 사이트 등록: {site}", on_log)

    driver.get(SITE_BOARD_URL)
    time.sleep(random.uniform(2.0, 3.0))
    if not _is_logged_in(driver):
        if not prepare_naver_session(
            driver,
            on_log=on_log,
            login_confirmed=login_confirmed,
            on_ready_for_login=on_ready_for_login,
            naver_id=naver_id,
            naver_password=naver_password,
            twocaptcha_api_key=twocaptcha_api_key,
        ):
            raise RuntimeError("네이버 로그인이 필요합니다.")

    existing = resolve_registered_site(driver, site, on_log=on_log)
    if not existing:
        _register_site_from_board(driver, site, on_log=on_log)
        if not skip_captcha:
            _handle_captcha_if_needed(
                driver,
                twocaptcha_api_key=twocaptcha_api_key,
                on_log=on_log,
                login_confirmed=login_confirmed,
                on_ready_for_login=on_ready_for_login,
            )
    else:
        if _site_host(existing) != _site_host(site):
            _emit(
                f"  ⚠ 목록의 등록 URL 호스트 불일치 — 새로 등록: {existing} ≠ {site}",
                on_log,
            )
            _register_site_from_board(driver, site, on_log=on_log)
            if not skip_captcha:
                _handle_captcha_if_needed(
                    driver,
                    twocaptcha_api_key=twocaptcha_api_key,
                    on_log=on_log,
                    login_confirmed=login_confirmed,
                    on_ready_for_login=on_ready_for_login,
                )
        else:
            _emit(f"  이미 등록된 사이트: {existing}", on_log)
            site = existing

    _navigate_to_verify_page(driver, site, on_log=on_log)
    _emit(f"  소유확인 URL: {driver.current_url}", on_log)

    _select_html_tag_method(driver, on_log=on_log)

    _emit("  meta content 추출 대기…", on_log)
    token = _wait_for_verification_meta_token(driver, timeout=35.0, on_log=on_log)
    if not token:
        _emit("  meta 미추출 — HTML 태그 재선택 후 재시도", on_log)
        _select_html_tag_method(driver, on_log=on_log)
        token = _wait_for_verification_meta_token(driver, timeout=25.0, on_log=on_log)

    if token:
        _emit(f"  meta content 추출 (submit-meta 전송): {token[:12]}…", on_log)
        return token

    raise RuntimeError(
        f"HTML 태그 meta content 를 찾지 못했습니다.\n"
        f"현재 URL: {driver.current_url}\n"
        "소유확인 페이지에서 [HTML 태그]를 선택했는지 확인하세요."
    )


def fetch_html_tag_verification_token(
    driver,
    site_url: str,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    naver_id: str = "",
    naver_password: str = "",
    twocaptcha_api_key: str = "",
) -> str:
    """HTML 태그 소유확인 meta 만 가져옴 (캡챠 자동·소유확인 클릭 없음)."""
    return register_site_and_get_verification_token(
        driver,
        site_url,
        on_log=on_log,
        login_confirmed=login_confirmed,
        on_ready_for_login=on_ready_for_login,
        naver_id=naver_id,
        naver_password=naver_password,
        twocaptcha_api_key=twocaptcha_api_key,
        skip_captcha=True,
    )


def verify_site_listed_on_naver_board(
    driver,
    site_url: str,
    *,
    on_log: LogFn = None,
) -> bool:
    """서치어드바이저 사이트 목록(board)에 해당 호스트가 정확히 있는지 확인."""
    site = normalize_site_url(site_url)
    wanted_host = _site_host(site)
    _emit(f"  네이버 사이트 목록 확인: {site}", on_log)
    driver.get(SITE_BOARD_URL)
    time.sleep(2.5)
    matched = resolve_registered_site(driver, site, on_log=on_log)
    if matched and _site_host(matched) == wanted_host:
        _emit(f"  ✓ 사이트 목록 등록 확인: {matched}", on_log)
        return True
    if matched:
        _emit(
            f"  ✗ 호스트 불일치 — 요청 {wanted_host}, 목록 {matched}",
            on_log,
        )
    else:
        _emit(f"  ✗ 사이트 목록에 없음: {site}", on_log)
    return False


def confirm_site_ownership(
    driver,
    site_url: str,
    *,
    meta_content: str = "",
    check_site_meta: bool = False,
    meta_initial_wait_sec: float = 60.0,
    meta_poll_interval_sec: float = 30.0,
    meta_max_poll_sec: float = 240.0,
    meta_post_ready_wait_sec: float = 20.0,
    meta_verify_max_attempts: int = 3,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    twocaptcha_api_key: str = "",
) -> bool:
    """[소유 확인] 클릭 → CAPTCHA 시 2Captcha 자동 입력 (선택: 사이트 HTML 메타 확인)."""
    from naver_captcha import OwnershipVerifyFailedError, ownership_verify_failed_alert

    site = normalize_site_url(site_url)
    meta = (meta_content or "").strip()
    _emit(f"네이버 [소유 확인] 준비: {site}", on_log)

    for verify_attempt in range(1, max(1, meta_verify_max_attempts) + 1):
        if verify_attempt > 1:
            _emit(
                f"  소유확인 재시도 ({verify_attempt}/{meta_verify_max_attempts})",
                on_log,
            )

        if _is_on_verify_page(driver, site):
            _emit("  소유확인 페이지 새로고침 후 진행", on_log)
            driver.refresh()
            time.sleep(random.uniform(2.0, 3.0))
        else:
            _navigate_to_verify_page(driver, site, on_log=on_log)
        _select_html_tag_method(driver, on_log=on_log)

        check_meta = meta
        if not check_meta:
            token_on_page = _wait_for_verification_meta_token(
                driver, timeout=15.0, on_log=on_log
            )
            if token_on_page:
                check_meta = token_on_page
                _emit(
                    f"  네이버 화면 meta content — 사이트 HTML 대조: {check_meta[:12]}…",
                    on_log,
                )

        if check_meta and check_site_meta:
            initial = meta_initial_wait_sec if verify_attempt == 1 else 0
            _emit(
                f"  소유확인 전 사이트 메타 태그 확인 "
                f"({verify_attempt}/{meta_verify_max_attempts})",
                on_log,
            )
            if not wait_for_meta_deployed(
                site,
                check_meta,
                initial_wait_sec=initial,
                poll_interval_sec=meta_poll_interval_sec,
                max_poll_sec=meta_max_poll_sec,
                post_ready_wait_sec=meta_post_ready_wait_sec,
                on_log=on_log,
            ):
                _emit("  ✗ 메타 태그 미반영 — 소유확인 중단", on_log)
                return False

        _emit(f"  [소유확인] 버튼 클릭 ({verify_attempt}회차)", on_log)
        if not _click_ownership_verify_button(driver, on_log=on_log):
            raise RuntimeError("소유확인 버튼을 찾지 못했습니다.")

        time.sleep(random.uniform(1.0, 1.8))
        try:
            captcha_ok = _handle_captcha_if_needed(
                driver,
                twocaptcha_api_key=twocaptcha_api_key,
                on_log=on_log,
                login_confirmed=login_confirmed,
                on_ready_for_login=on_ready_for_login,
                wait_for_modal=True,
            )
        except OwnershipVerifyFailedError:
            captcha_ok = False

        if not captcha_ok:
            if verify_attempt < meta_verify_max_attempts:
                _emit("  소유확인 실패 — 재시도", on_log)
                continue
            return False

        if ownership_verify_failed_alert(driver, on_log=on_log):
            if verify_attempt < meta_verify_max_attempts:
                _emit("  메타 미인식 — 소유확인 재시도", on_log)
                continue
            return False

        time.sleep(random.uniform(1.0, 2.0))
        _wait_and_click_success_dialog(driver, on_log=on_log, timeout=25.0)
        time.sleep(random.uniform(1.0, 2.0))
        _dismiss_popup_confirm_or_esc(driver, on_log=on_log, timeout=5.0)

        result = driver.page_source or ""
        ok_words = ("소유 확인이 완료", "소유확인 완료", "인증되었습니다", "verified", "완료")
        if any(w in result for w in ok_words):
            _emit("  ✓ 네이버 소유 확인 성공", on_log)
            _dismiss_popup_confirm_or_esc(driver, on_log=on_log, timeout=5.0)
            return True

        if verify_site_listed_on_naver_board(driver, site, on_log=on_log):
            return True

        if verify_attempt < meta_verify_max_attempts:
            _emit("  소유확인 결과 불명 — 재시도", on_log)
            continue
        return False

    return False
