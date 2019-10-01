# upload sourcemaps for extension toolkit and then remove files

#1) Set variables
APP_DIR="$PWD/apps/extension-toolkit"
PACKAGE_VERSION=$(grep 'version' package.json | cut -d '"' -f4 | tr -d '[[:space:]]')

#2) Extract sourcemap files
cd $APP_DIR
rm -r www_sourcemaps
mkdir www_sourcemaps
cd "$APP_DIR/www"
# find all sourcemap files and move to separate folder
SOURCE_MAP=`find . -maxdepth 1 -mindepth 1 -name '*.map' -exec mv {} ../www_sourcemaps/ \;`
echo $SOURCE_MAP

#3) create Sentry release
printf "\nPreparing version $PACKAGE_VERSION...\n\n"
cd "$APP_DIR/www_sourcemaps"
SENTRY_VERSION="picsa-app@$PACKAGE_VERSION"
# export properties to be picked up by cli
export SENTRY_PROPERTIES="$APP_DIR/sentry.properties"
# NOTE - for below code to work sentry-cli must be installed on linux subsystem
# see install guides at: https://docs.sentry.io/cli/installation/
sentry-cli releases new $SENTRY_VERSION
sentry-cli releases files $SENTRY_VERSION upload-sourcemaps ./ --rewrite


###############################################################################
# Old code, for non-cli usage (manual methods)
# Kept for reference, adapted from:
# https://stackoverflow.com/questions/53715981/how-to-automatically-create-a-sentry-release-and-upload-source-maps-to-sentry-in
###############################################################################

#2) get metadata 

#SENTRY_PROPS="$PWD/apps/extension-toolkit/sentry.properties"
#SENTRY_ORG=`sed -n 's/defaults\.org=\(.*\)/\1/p' < ${SENTRY_PROPS}`
#SENTRY_PROJECT=`sed -n 's/defaults\.project=\(.*\)/\1/p' < ${SENTRY_PROPS}`
#SENTRY_TOKEN=`sed -n 's/auth\.token=\(.*\)/\1/p' < ${SENTRY_PROPS}`


#SENTRY_URL="https://sentry.io/api/0/projects/:${SENTRY_ORG}/:${SENTRY_PROJECT}/releases/"
#echo URL: ${SENTRY_URL}
#printf "\nCreating a Sentry release for version $PACKAGE_VERSION...\n"
#printf "\nOrg: ${SENTRY_ORG}\nProject: ${SENTRY_PROJECT}\n"

#curl "${SENTRY_URL}"\
#  -X POST \
#  -H "Authorization: Bearer ${SENTRY_TOKEN}" \
#  -H 'Content-Type: application/json' \
#  -d "{\"version\": \"${PACKAGE_VERSION}\"}" \

#4) Upload a file for the given release
#printf "\n\nUploading sourcemap file to Sentry: ${SOURCE_MAP}...\n"
#curl "https://sentry.io/api/0/projects/:sentry_organization_slug/:sentry_project_slug/releases/$PACKAGE_VERSION/files/" \
#  -X POST \
#  -H "Authorization: Bearer ${SENTRY_TOKEN}" \
#  -F file=@${SOURCE_MAP} \
#  -F name="https://THE_URL_OF_THE_MAIN_JS_FILE/$SOURCE_MAP"
