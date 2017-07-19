## FastBoot GitLab Downloader

This downloader for the [FastBoot App Server][app-server] works with GitLab
Builds to download and unzip the latest build artifacts of your deployed
application.

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
