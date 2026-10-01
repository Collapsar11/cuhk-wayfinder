#!/usr/bin/env python3
"""Bundle the website, build Android, and sign a release without exposing the key."""
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
ENV = os.environ.copy()
jbr = Path('/Applications/Android Studio.app/Contents/jbr/Contents/Home')
if not ENV.get('JAVA_HOME') and jbr.exists():
    ENV['JAVA_HOME'] = str(jbr)
sdk = Path(ENV.get('ANDROID_HOME') or ENV.get('ANDROID_SDK_ROOT') or Path.home() / 'Library/Android/sdk')
ENV['ANDROID_HOME'] = str(sdk)
java_bin = Path(ENV['JAVA_HOME']) / 'bin' if ENV.get('JAVA_HOME') else None
keytool = str(java_bin / 'keytool') if java_bin else 'keytool'
BUILD_TOOLS = sdk / 'build-tools/36.0.0'
if not (BUILD_TOOLS / 'apksigner').is_file():
    raise SystemExit('Install Android SDK build-tools;36.0.0 and platforms;android-37.0 first.')

def run(args, env=ENV):
    subprocess.run(args, check=True, env=env)

run(['npm', 'run', 'build'], {**ENV, 'BASE_PATH': '/app/', 'BUILD_DIR': 'dist-android', 'VITE_ANDROID': 'true'})
assets = ROOT / 'android/app/src/main/assets'
if assets.exists():
    shutil.rmtree(assets)
shutil.copytree(ROOT / 'dist-android', assets, ignore=shutil.ignore_patterns('sw.js', '.nojekyll'))
shutil.copyfile(ROOT / 'android/LICENSE-APACHE-2.0.txt', assets / 'LICENSE-APACHE-2.0.txt')
run(['./android/gradlew', '-p', 'android', 'testDebugUnitTest', 'lintRelease', 'assembleDebug', 'assembleRelease', '--console=plain'])

sign_dir = ROOT / '.signing'
sign_dir.mkdir(mode=0o700, exist_ok=True)
sign_dir.chmod(0o700)
key = sign_dir / 'cuhk-wayfinder-release.p12'
password_file = sign_dir / 'store-password'
if key.exists() != password_file.exists():
    raise SystemExit('Incomplete signing setup: restore the existing key/password pair; do not replace the key.')
if not key.exists():
    password = secrets.token_urlsafe(36)
    fd = os.open(password_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as handle:
        handle.write(password)
    try:
        run([keytool, '-genkeypair', '-keystore', str(key), '-storetype', 'PKCS12',
             '-storepass:env', 'WAYFINDER_KEY_PASSWORD', '-keypass:env', 'WAYFINDER_KEY_PASSWORD',
             '-alias', 'cuhk-wayfinder', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000',
             '-dname', 'CN=CUHK Wayfinder, O=Independent Campus Navigation', '-noprompt'],
            {**ENV, 'WAYFINDER_KEY_PASSWORD': password})
        key.chmod(0o600)
    except Exception:
        # Keep any partially generated key for inspection rather than silently replacing it.
        raise
password = password_file.read_text().strip()
version = json.loads((ROOT / 'package.json').read_text())['version']
output = ROOT / 'releases' / ('android-v' + version)
output.mkdir(parents=True, exist_ok=True)
unsigned = ROOT / 'android/app/build/outputs/apk/release/app-release-unsigned.apk'
aligned = output / 'aligned-unsigned.apk'
apk = output / ('cuhk-wayfinder-' + version + '.apk')
run([str(BUILD_TOOLS / 'zipalign'), '-f', '-p', '4', str(unsigned), str(aligned)])
run([str(BUILD_TOOLS / 'apksigner'), 'sign', '--ks', str(key), '--ks-key-alias', 'cuhk-wayfinder',
     '--ks-pass', 'env:WAYFINDER_KEY_PASSWORD', '--key-pass', 'env:WAYFINDER_KEY_PASSWORD',
     '--out', str(apk), str(aligned)], {**ENV, 'WAYFINDER_KEY_PASSWORD': password})
aligned.unlink()
run([str(BUILD_TOOLS / 'apksigner'), 'verify', '--verbose', '--print-certs', str(apk)])
run([str(BUILD_TOOLS / 'zipalign'), '-c', '-p', '4', str(apk)])
checksum = hashlib.sha256(apk.read_bytes()).hexdigest()
(output / 'SHA256SUMS.txt').write_text(f'{checksum}  {apk.name}\n')
print(json.dumps({'apk': str(apk), 'bytes': apk.stat().st_size, 'sha256': checksum,
                  'signing_key': str(key), 'key_uploaded': False}, ensure_ascii=False, indent=2))
