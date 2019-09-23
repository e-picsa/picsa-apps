#!/bin/bash
### NOTE 1 - if developing in vscode ensure LF line endings set (see bottom right corner)
### NOTE 2 - if using windows good to have linux subsystem installed (otherwise use cygwin)
BUILD_DIR="./apps/extension-toolkit/platforms/android/app/build/outputs/apk/release";
echo "Specify app version number:"
read VERSION;
#### NOTE 3 - assumes jarsigner installed on linux subsystem, but could also call windows v
#### See install notes: https://www.digitalocean.com/community/tutorials/how-to-install-java-with-apt-get-on-debian-8
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore picsa-mw.keystore ${BUILD_DIR}/app-release-unsigned.apk picsa-mw
#### NOTE 4 - access windows program from linux subsystem using via /mnt
ZIPALIGN="/mnt/c/Users/chris/AppData/Local/Android/sdk/build-tools/28.0.3/zipalign.exe";
${ZIPALIGN} -v 4 ${BUILD_DIR}/app-release-unsigned.apk ./publish/${VERSION}.signed.apk;