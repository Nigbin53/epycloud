#!/usr/bin/env python3
"""Собирает статическое мини-приложение в ./miniapp из рабочей веб-версии.

Источник:  ../06_web-version/gym-ui-kit-audited  (приложение redesign/app.html, обе темы)
Результат: ./miniapp  — то, что публикуется на GitHub Pages.

Запуск:  python3 tools/build_miniapp.py
         python3 tools/build_miniapp.py --project-ref ВАШ_REF   (впишет адрес Supabase в config.js и соберёт)
Ничего не удаляет: файлы копируются поверх. Исходники рабочей версии не меняются.
"""
from pathlib import Path
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "06_web-version" / "gym-ui-kit-audited"
SHELL = ROOT / "miniapp-src"
OUT = ROOT / "miniapp"

COPY_DIRS = ["assets", "fitness-ui-kit", "white/assets", "redesign", "equipment"]
SKIP_NAMES = {"__pycache__", ".DS_Store"}
SKIP_SUFFIXES = {".py", ".md", ".pyc"}
# в equipment нужны только данные и скрипты просмотра, без локального сервера и тестовых загрузок
EQUIPMENT_SKIP = {"server.py", "README-server.md", "uploads"}

HEAD_INJECT = (
    '<script src="https://telegram.org/js/telegram-web-app.js"></script>'
    '<script src="../config.js"></script>'
    '<script src="../tg-sync.js"></script>\n</head>'
)


def ignore(directory, names):
    skipped = set()
    for name in names:
        path = Path(name)
        if name in SKIP_NAMES or path.suffix in SKIP_SUFFIXES:
            skipped.add(name)
        if Path(directory).name == "equipment" and name in EQUIPMENT_SKIP:
            skipped.add(name)
    return skipped


def set_project_ref(ref):
    import re
    if not re.fullmatch(r"[a-z0-9]{10,30}", ref):
        sys.exit("Project ref — это 20 символов из латиницы и цифр, смотрите Project Settings → General в Supabase.")
    config = SHELL / "config.js"
    text = config.read_text(encoding="utf-8")
    text = re.sub(r"API_BASE:\s*'[^']*'", f"API_BASE: 'https://{ref}.supabase.co/functions/v1'", text)
    config.write_text(text, encoding="utf-8")


def main():
    if "--project-ref" in sys.argv:
        set_project_ref(sys.argv[sys.argv.index("--project-ref") + 1])
    if not SRC.is_dir():
        sys.exit(f"Не найдена рабочая версия: {SRC}")
    OUT.mkdir(exist_ok=True)
    for rel in COPY_DIRS:
        src = SRC / rel
        dst = OUT / rel
        if not src.is_dir():
            sys.exit(f"Не найдена папка: {src}")
        shutil.copytree(src, dst, dirs_exist_ok=True, ignore=ignore)

    app = OUT / "redesign" / "app.html"
    html = app.read_text(encoding="utf-8")
    if "tg-sync.js" not in html:
        assert html.count("</head>") == 1, "в app.html должен быть один </head>"
        html = html.replace("</head>", HEAD_INJECT, 1)
        app.write_text(html, encoding="utf-8")

    for item in SHELL.iterdir():
        if item.is_file():
            shutil.copy2(item, OUT / item.name)
    (OUT / ".nojekyll").write_text("", encoding="utf-8")

    files = [p for p in OUT.rglob("*") if p.is_file()]
    size = sum(p.stat().st_size for p in files)
    print(json.dumps({"files": len(files), "megabytes": round(size / 1048576, 1)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
