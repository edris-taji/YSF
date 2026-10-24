#!/usr/bin/env python3
"""Static-site checks for GitHub Pages (case-sensitive hosting).

Fails (exit code 1) if any page references a local file that does not exist with exactly the same
upper/lower case, links to an in-page anchor that is missing, or has unbalanced tags.
Standard library only. Usage: python tools/check_site.py [site_root]
"""
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
OPTIONAL_END = {'p', 'li', 'option', 'tr', 'td', 'th'}


def exists_exact(rel):
    """True only if every path segment matches the on-disk name exactly (like a Linux web server)."""
    path = ROOT
    for part in rel.replace('\\', '/').split('/'):
        if part in ('', '.'):
            continue
        if not os.path.isdir(path) or part not in os.listdir(path):
            return False
        path = os.path.join(path, part)
    return True


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs, self.ids, self.stack, self.errors = [], set(), [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids:
                self.errors.append(f'duplicate id "{a["id"]}" (line {self.getpos()[0]})')
            self.ids.add(a['id'])
        for key in ('src', 'href', 'poster', 'action'):
            if a.get(key):
                self.refs.append((key, a[key], self.getpos()[0]))
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        while self.stack and self.stack[-1] != tag and self.stack[-1] in OPTIONAL_END:
            self.stack.pop()
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.errors.append(f'unexpected </{tag}> (line {self.getpos()[0]})')


def check_css(path):
    problems = []
    css = open(path, encoding='utf-8').read()
    for url in re.findall(r'url\(([^)]*)\)', css):
        url = url.strip('\'" ')
        if url.startswith(('data:', 'http', '#')):
            continue
        rel = os.path.relpath(os.path.normpath(os.path.join(os.path.dirname(path), url)), ROOT)
        if not exists_exact(rel):
            problems.append(f'{os.path.relpath(path, ROOT)}: missing {url}')
    return problems


def main():
    problems = []
    pages = sorted(f for f in os.listdir(ROOT) if f.endswith('.html'))
    for name in pages:
        page = Page()
        page.feed(open(os.path.join(ROOT, name), encoding='utf-8').read())
        page.close()
        problems += [f'{name}: {e}' for e in page.errors]
        leftover = [t for t in page.stack if t not in OPTIONAL_END]
        if leftover:
            problems.append(f'{name}: unclosed {leftover}')
        for attr, url, line in page.refs:
            parsed = urlparse(url)
            if parsed.scheme or url.startswith('//'):
                continue  # external, mailto:, tel:
            if url.startswith('#'):
                if len(url) > 1 and url[1:] not in page.ids:
                    problems.append(f'{name}:{line}: anchor {url} not found')
                continue
            if not exists_exact(unquote(parsed.path)):
                problems.append(f'{name}:{line}: {attr}="{url}" does not exist (check upper/lower case)')
    for dirpath, _, files in os.walk(os.path.join(ROOT, 'css')):
        problems += [p for f in files if f.endswith('.css') for p in check_css(os.path.join(dirpath, f))]

    for p in problems:
        print('ERROR', p)
    print(f'{len(pages)} pages checked, {len(problems)} problem(s)')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
