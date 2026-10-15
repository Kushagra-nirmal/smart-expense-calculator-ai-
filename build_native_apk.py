import os
import shutil
import subprocess
import zipfile
import json
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "Frontend", "dist")
OUTPUT_APK_PROJECT = os.path.join(BASE_DIR, "Smart-Expense-Tracker-AI.apk")
OUTPUT_APK_DOWNLOADS = r"c:\Users\01234\Downloads\Smart-Expense-Tracker-AI.apk"
OUTPUT_APK_WEB = os.path.join(FRONTEND_DIST, "Smart-Expense-Tracker-AI.apk")

BASE_TEMPLATE_APK = os.path.join(BASE_DIR, "Smart-Expense-Tracker-AI.apk")
JARSIGNER = r"C:\Users\01234\.antigravity-ide\extensions\redhat.java-1.57.0-win32-x64\jre\25.0.4.1-win32-x86_64\bin\jarsigner.exe"
KEYSTORE_PATH = r"c:\Users\01234\Downloads\production-grade-agentic-system-master\supportai-release.keystore"
KEYSTORE_PASS = "supportai123"
KEY_ALIAS = "supportai"

def build_apk():
    print("=" * 65)
    print("  🚀 BUILDING SIGNED ANDROID APK FOR SMART EXPENSE TRACKER AI")
    print("=" * 65)

    if not os.path.exists(BASE_TEMPLATE_APK):
        print(f"Error: Base template APK not found at: {BASE_TEMPLATE_APK}")
        sys.exit(1)

    if not os.path.exists(FRONTEND_DIST):
        print(f"Error: Frontend dist folder not found at: {FRONTEND_DIST}")
        sys.exit(1)

    temp_apk = os.path.join(BASE_DIR, "temp_staging_expense.apk")
    if os.path.exists(temp_apk):
        try:
            os.remove(temp_apk)
        except Exception:
            pass

    app_config = {
        "appName": "Smart Expense Tracker AI",
        "shortName": "ExpenseSense AI",
        "version": "2.0.0",
        "package": "com.smartexpense.ai",
        "serverUrl": "https://smart-expense-tracker-ai-production.up.railway.app/api",
        "cloudUrl": "https://smart-expense-tracker-ai-production.up.railway.app/api",
        "localUrl": "http://127.0.0.1:5000/api",
        "lanUrl": "http://192.168.1.20:5000/api",
        "description": "Smart Expense Tracker AI - Intelligent Personal Finance"
    }

    print("\n[1/4] Repackaging APK with Smart Expense Tracker AI web assets...")
    with zipfile.ZipFile(BASE_TEMPLATE_APK, "r") as zin:
        with zipfile.ZipFile(temp_apk, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                # Strip old web assets and signature block to allow fresh re-signing
                if item.filename.startswith("assets/www/") or item.filename.startswith("META-INF/"):
                    continue
                zout.writestr(item, zin.read(item.filename))

            # Add all built assets from Frontend/dist to assets/www/
            for root, dirs, files in os.walk(FRONTEND_DIST):
                for file in files:
                    if file.endswith(".apk"):
                        continue
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, FRONTEND_DIST).replace("\\", "/")
                    target_entry = f"assets/www/{rel_path}"
                    zout.write(full_path, target_entry)
                    print(f"  + Added: {target_entry}")

            # Add app configuration metadata
            zout.writestr("assets/www/app_config.json", json.dumps(app_config, indent=2))
            print("  + Added: assets/www/app_config.json")

    print(f"\n[2/4] Staging APK created ({os.path.getsize(temp_apk):,} bytes).")

    print("\n[3/4] Signing APK with OpenJDK 25 jarsigner...")
    sign_cmd = [
        JARSIGNER,
        "-sigalg", "SHA256withRSA",
        "-digestalg", "SHA-256",
        "-keystore", KEYSTORE_PATH,
        "-storepass", KEYSTORE_PASS,
        "-keypass", KEYSTORE_PASS,
        "-signedjar", OUTPUT_APK_PROJECT,
        temp_apk,
        KEY_ALIAS
    ]
    sign_res = subprocess.run(sign_cmd, capture_output=True, text=True)
    if sign_res.returncode != 0:
        print("Error during jarsigner signing:", sign_res.stderr)
        sys.exit(1)

    print("\n[4/4] Verifying signed APK integrity...")
    verify_cmd = [JARSIGNER, "-verify", OUTPUT_APK_PROJECT]
    verify_res = subprocess.run(verify_cmd, capture_output=True, text=True)
    print("jarsigner verification result:", verify_res.stdout.strip())

    # Distribute APK to Downloads folder and web server
    shutil.copy2(OUTPUT_APK_PROJECT, OUTPUT_APK_DOWNLOADS)
    shutil.copy2(OUTPUT_APK_PROJECT, OUTPUT_APK_WEB)

    print("\n" + "=" * 65)
    print("  🎉 ANDROID APK GENERATION COMPLETE!")
    print(f"  📦 Downloads Folder : {OUTPUT_APK_DOWNLOADS} ({os.path.getsize(OUTPUT_APK_DOWNLOADS):,} bytes)")
    print(f"  📦 Project Root     : {OUTPUT_APK_PROJECT} ({os.path.getsize(OUTPUT_APK_PROJECT):,} bytes)")
    print(f"  🌐 Direct Web Link   : http://localhost:5000/Smart-Expense-Tracker-AI.apk")
    print(f"  📱 Phone Wi-Fi Link : http://192.168.1.20:5000/Smart-Expense-Tracker-AI.apk")
    print("=" * 65)

    if os.path.exists(temp_apk):
        try:
            os.remove(temp_apk)
        except Exception:
            pass

if __name__ == "__main__":
    build_apk()
