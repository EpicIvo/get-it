import {defineConfig} from 'vitest/config'
import GithubActionsReporter from 'vitest-github-actions-reporter'

export default defineConfig({
  test: {
    globalSetup: [
      './test/helpers/globalSetup.http.ts',
      './test/helpers/globalSetup.https.ts',
      './test/helpers/globalSetup.proxy.http.ts',
      './test/helpers/globalSetup.proxy.https.ts',
    ],
    reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
  },
})
