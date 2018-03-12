## FastBoot GitLab Downloader

This downloader for the [FastBoot App Server][app-server] works with GitLab
Builds to download and unzip the latest build artifacts of your deployed
application.

You need to activate GitLab Builds in your repository. Thereafter, create a .gitlab-ci.yml file in the root of the repo which can look something like this

````yaml
image: node:latest

cache:
  paths:
  - node_modules/

build:
  script:
   - curl -o- -L https://yarnpkg.com/install.sh | bash
   - export PATH=$HOME/.yarn/bin:$PATH
   - yarn global add ember-cli
   - yarn install --non-interactive
   - ember build --environment=production
  artifacts:
    paths:
    - dist/

````

This pipeline will build your ember app on each commit and zip then upload the contents of the dist folder as zipped artifacts. It is now ready to be downloaded and served by a Fastboot App Server.

[app-server]: https://github.com/ember-fastboot/fastboot-app-server

To use the downloader, configure it with your GitLab API token and your repo:

```js
const FastBootAppServer = require('fastboot-app-server');
const GitLabDownloader  = require('fastboot-gitlab-downloader');

let downloader = new GitLabDownloader({
  url:      'https://gitlab.com',           // Gitlab host e.g self hosted, defaults to https://gitlab.com
  token:    '1_A23CtFvGnsgdqwLPYZ',         // your Gitlab private token
  repo:     'my-app/ember.js',              // name of your repo
  branch:   'master',                       // optional, defaults to 'master'
  job:      'build',                        // optional, defaults to 'build'
  path:     'dist'                          // optional path of the `dist` directory, defaults to 'dist'
});

let server = new FastBootAppServer({
  downloader: downloader
});
```

When the downloader runs, it will download the zipped artifacts for the most recent build for the specified repo and branch.

If you like this, you may also be interested in the companion [fastboot-gitlab-notifier](https://github.com/campus-discounts/fastboot-gitlab-notifier).
