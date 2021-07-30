const fs = require('fs')
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const moment = require('moment');
moment.locale('hu');

const execSync = require('child_process').execSync;
const commit = parseInt(execSync('git rev-list --all --count').toString());
//const date = parseInt(execSync('git log -1 --format=%at').toString());
const date = Date.now()
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

const settings = {
    "branch": branch,
    "date": date,
    "dateString": moment(date ).format('L LTS'),
    "commit": commit,
//  "nodeVersion": process.versions,
//    "env": process.env.NODE_ENV,
}

const pkg = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`).toString());
settings.version = `${pkg.version}${settings.branch === 'master' ? '' : '-' + settings.branch + '-r' + settings.commit}`;

module.exports = settings

