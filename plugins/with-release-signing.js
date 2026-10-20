// Signs local release builds (`./gradlew bundleRelease`) with the Play upload key
// and lets the versionCode be passed at build time, so a release doesn't need
// `eas build --local`. Secrets stay out of the repo: they're read by Gradle from
// ~/.gradle/gradle.properties (REMINDU_UPLOAD_STORE_FILE, REMINDU_UPLOAD_STORE_PASSWORD,
// REMINDU_UPLOAD_KEY_ALIAS, REMINDU_UPLOAD_KEY_PASSWORD). Without them, release
// builds fall back to the debug key, which Play rejects.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// remindu-release-signing';

const RELEASE_SIGNING = `
        release {
            ${MARKER}
            if (findProperty('REMINDU_UPLOAD_STORE_FILE')) {
                storeFile file(findProperty('REMINDU_UPLOAD_STORE_FILE'))
                storePassword findProperty('REMINDU_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('REMINDU_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('REMINDU_UPLOAD_KEY_PASSWORD')
            }
        }`;

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (gradle.includes(MARKER)) return mod;

    // `-PversionCode=5` overrides the value from app.json.
    gradle = gradle.replace(
      /versionCode (\d+)/,
      "versionCode((findProperty('versionCode') ?: '$1').toInteger())",
    );

    gradle = gradle.replace(
      /(signingConfigs \{\n\s*debug \{[^}]*\})/,
      `$1${RELEASE_SIGNING}`,
    );

    gradle = gradle.replace(
      /(release \{\n(?:\s*\/\/.*\n)*\s*)signingConfig signingConfigs\.debug/,
      `$1if (findProperty('REMINDU_UPLOAD_STORE_FILE')) {
                signingConfig signingConfigs.release
            } else {
                logger.warn('REMINDU_UPLOAD_STORE_FILE not set: release build is signed with the debug key')
                signingConfig signingConfigs.debug
            }`,
    );

    if (!gradle.includes('signingConfigs.release')) {
      throw new Error('with-release-signing: build.gradle template changed, update the plugin');
    }
    mod.modResults.contents = gradle;
    return mod;
  });
}

module.exports = withReleaseSigning;
