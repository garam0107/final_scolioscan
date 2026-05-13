const { withMainActivity } = require('expo/config-plugins');

const FINISH_BACK_BUTTON_METHOD = `  override fun invokeDefaultOnBackPressed() {
      // 홈에서 뒤로가기 종료 시 백그라운드로 보내지 않고 task를 제거해 다음 실행 때 새 Activity로 시작되게 한다.
      finishAndRemoveTask()
  }`;

function withFinishBackButtonTask(config) {
  return withMainActivity(config, (config) => {
    if (config.modResults.language === 'kt') {
      config.modResults.contents = updateMainActivity(config.modResults.contents);
    }

    return config;
  });
}

function updateMainActivity(contents) {
  const methodStart = contents.indexOf('  override fun invokeDefaultOnBackPressed()');

  if (methodStart === -1) {
    return contents;
  }

  const methodEnd = findFunctionEnd(contents, methodStart);

  if (methodEnd === -1) {
    return contents;
  }

  const nextContents = `${contents.slice(0, methodStart)}${FINISH_BACK_BUTTON_METHOD}${contents.slice(methodEnd)}`;

  if (!nextContents.includes('Build.VERSION')) {
    return nextContents.replace(/\nimport android\.os\.Build\r?\n/, '\n');
  }

  return nextContents;
}

function findFunctionEnd(contents, startIndex) {
  const bodyStart = contents.indexOf('{', startIndex);

  if (bodyStart === -1) {
    return -1;
  }

  let depth = 0;

  for (let index = bodyStart; index < contents.length; index += 1) {
    const char = contents[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return index + 1;
      }
    }
  }

  return -1;
}

module.exports = withFinishBackButtonTask;
