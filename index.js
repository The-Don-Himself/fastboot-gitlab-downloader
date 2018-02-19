"use strict";

const request   = require('request');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');
const fsp   = require('fs-promise');
const exec  = require('child_process').exec;

function AppNotFoundError(message) {
  let error = new Error(message);
  error.name = 'AppNotFoundError';

  return error;
}

/*
 * Downloader class that downloads the latest Ember build artifacts from GitLab and unzips it.
 */
class GitLabDownloader {
  constructor(options) {
    this.ui = options.ui;

    this.url = options.url || 'https://gitlab.com';
    this.token = options.token;
    this.repo = options.repo;
    this.branch = options.branch || 'master';
    this.job = options.job || 'build';

    this.outputPath = options.path || 'dist';

    let repo = this.repo;
    let branch = this.branch;
    let job = this.job;

    this.fileUrl = 'https://gitlab.com/' + repo + '/-/jobs/artifacts/'+ branch + '/download?job=' + job;
  }

  download() {
    let addon = this;

    if (!addon.repo || !addon.token) {
      addon.ui.writeError('no repo or token provided; not downloading app');
      return Promise.reject(new AppNotFoundError());
    }

    return addon.fetchCurrentBuild()
      .then(() => addon.removeOldApp())
      .then(() => addon.downloadAppZip())
      .then(() => addon.unzipApp())
      .then(() => addon.installNPMDependencies())
      .then(() => addon.outputPath);
  }

  removeOldApp() {
    let addon = this;

    this.ui.writeLine('removing ' + this.outputPath);
    return fsp.remove(this.outputPath);
  }

  fetchCurrentBuild() {
    let addon = this;

    let fileUrl = addon.fileUrl;
    let token = addon.token;

    let options = {
        method: 'HEAD',
        uri: fileUrl,
        headers: {
            'PRIVATE-TOKEN': token
        }
    };

    addon.ui.writeLine('domain     : ' + addon.url);
    addon.ui.writeLine('repository : ' + addon.repo);
    addon.ui.writeLine('branch     : ' + addon.branch);
    addon.ui.writeLine('job        : ' + addon.job);

    return new Promise((res, rej) => {
        request(options)
        .on('response', function(response) {
            let filename,
                contentDisp = response.headers['content-disposition'];
            if (contentDisp && /^attachment/i.test(contentDisp)) {
                filename = contentDisp.toLowerCase()
                    .split('filename=')[1]
                    .split(';')[0]
                    .replace(/"/g, '');
            }

            if(!filename){
                addon.ui.writeError('Did Not Find Zip File, Download Aborted.');
                rej(new AppNotFoundError());
            } else {
                addon.ui.writeLine('Found Zip File : ' + filename);
                addon.zipPath = path.basename(filename);

                let realDownloadUrl = response.request.uri.href;
                let jobID = realDownloadUrl.substring(realDownloadUrl.lastIndexOf("/jobs/") + 6 , realDownloadUrl.lastIndexOf("/artifacts/"));
                addon.ui.writeLine('Pipeline Build ID : ' + jobID);

                res();
            }
        })
        .on('error', function(error) {
            console.log('error:', error); // Print the error if one occurred
            addon.ui.writeError('could not fetch repo build artifact');
            rej(new AppNotFoundError());
        });
    });
  }

  downloadAppZip() {
    let addon = this;

    let fileUrl = addon.fileUrl;
    let token = addon.token;

    let options = {
        method: 'GET',
        uri: fileUrl,
        headers: {
            'PRIVATE-TOKEN': token
        }
    };

    return new Promise((res, rej) => {
        let r = request(options).on('response', function(response) {
            let zipPath = addon.zipPath;
            let file = fs.createWriteStream(zipPath);

            addon.ui.writeLine("saving zip object to " + zipPath);

            r.pipe(file)
                .on('close', res)
                .on('error', rej);
        });
    });
  }

  unzipApp() {
    let addon = this;

    let zipPath = addon.zipPath;

    return addon.exec('unzip ' + zipPath)
      .then(() => {
        addon.ui.writeLine("unzipped " + zipPath);
      });
  }

  installNPMDependencies() {
    let addon = this;

    return addon.exec(`cd ${addon.outputPath} && yarn install`)
      .then(() => addon.ui.writeLine('installed npm dependencies via yarn'))
      .catch(() => addon.ui.writeError('unable to install npm dependencies via yarn'));
  }

  exec(command) {
    let addon = this;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          addon.ui.writeError(`error running command ${command}`);
          addon.ui.writeError(stderr);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = GitLabDownloader;
