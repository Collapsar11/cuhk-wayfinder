#!/usr/bin/env python3
"""Publish a tested signed APK and checksum as a GitHub Release (not on gh-pages)."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.parse
import urllib.request
from github_api import get_token, request

root = Path(__file__).resolve().parents[1]
os.chdir(root)
if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 scripts/publish-android.py <release-notes-file>')
if subprocess.check_output(['git', 'status', '--porcelain'], text=True).strip():
    raise SystemExit('Commit and verify source before publishing.')
if subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip() != 'main':
    raise SystemExit('Publish from main.')
version = json.loads((root / 'package.json').read_text())['version']
tag = 'android-v' + version
directory = root / 'releases' / tag
apk = directory / ('cuhk-wayfinder-' + version + '.apk')
checksums = directory / 'SHA256SUMS.txt'
sha256 = hashlib.sha256(apk.read_bytes()).hexdigest()
if checksums.read_text() != f'{sha256}  {apk.name}\n':
    raise SystemExit('APK does not match its checksum file.')
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
repository = '/repos/Collapsar11/cuhk-wayfinder'
code, remote = request('GET', repository + '/commits/main')
if code != 200 or remote.get('sha') != commit:
    raise SystemExit('Push the verified source to origin/main before publishing.')
body = Path(sys.argv[1]).read_text() + f'\n\nSource: `{commit}`\n\nSHA-256: `{sha256}`\n'
code, release = request('GET', repository + '/releases/tags/' + tag)
if code == 404:
    code, release = request('POST', repository + '/releases', {
        'tag_name': tag, 'target_commitish': commit, 'name': '中大寻路 Android ' + version,
        'body': body, 'draft': True, 'prerelease': False})
elif code == 200 and release.get('draft') and release.get('target_commitish') == commit:
    code, release = request('PATCH', repository + '/releases/' + str(release['id']), {'body': body})
else:
    raise SystemExit('Release already published or belongs to another commit; create a new version.')
if code not in (200, 201):
    raise SystemExit(f'Cannot create draft release: HTTP {code}')
release_id = release['id']
token = get_token()
assets = {a['name']: a for a in release.get('assets', [])}
for path in (apk, checksums):
    digest = 'sha256:' + hashlib.sha256(path.read_bytes()).hexdigest()
    if path.name in assets:
        if assets[path.name].get('digest') != digest:
            raise SystemExit('Draft contains a different asset; inspect it before retrying.')
        continue
    url = 'https://uploads.github.com' + repository + '/releases/' + str(release_id) + '/assets?name=' + urllib.parse.quote(path.name)
    req = urllib.request.Request(url, data=path.read_bytes(), method='POST', headers={
        'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/vnd.android.package-archive' if path.suffix == '.apk' else 'text/plain',
        'User-Agent': 'CUHK-Wayfinder-Deployment', 'X-GitHub-Api-Version': '2022-11-28'})
    with urllib.request.urlopen(req, timeout=120) as response:
        asset = json.load(response)
    if asset.get('state') != 'uploaded' or asset.get('digest') != digest:
        raise SystemExit('Uploaded asset failed digest/state verification; release remains a draft.')
    assets[path.name] = asset
code, release = request('PATCH', repository + '/releases/' + str(release_id), {'draft': False, 'make_latest': 'true'})
if code != 200:
    raise SystemExit(f'Publish failed: HTTP {code}; inspect the existing draft.')
# Draft asset URLs can contain an untagged placeholder; read the published URLs.
code, release = request('GET', repository + '/releases/' + str(release_id))
if code != 200 or release.get('draft'):
    raise SystemExit('Release published, but its final download URLs could not be verified.')
print(json.dumps({'release': release['html_url'], 'assets': [
    {'name': a['name'], 'url': a['browser_download_url'], 'size': a['size'], 'digest': a.get('digest')}
    for a in release['assets']]}, ensure_ascii=False, indent=2))
