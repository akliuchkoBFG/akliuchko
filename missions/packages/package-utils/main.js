'use strict';

const path = require('path');
const exec = require('child_process').exec;

const TRUNK_DIR = path.resolve(Editor.projectInfo.path, "../../../..");

function buildSAKit() {
	return new Promise((resolve, reject) => {
		const casinoDockerDir = path.join(TRUNK_DIR, 'tools', 'docker', 'casino');
		exec(
			'/usr/bin/php casino_docker.php build_sakit',
			{
				cwd: casinoDockerDir
			},
			(err, stdout, stderr) => {
				if (err) {
					// Unexpected failure case
					Editor.error("SAKit build failed");
					reject(err);
				} else {
					if (stderr) {
						Editor.warn([
							"SAKit build may have failed",
							"stderr: " + stderr,
							"stdout: " + stdout,
						].join('\n'));
					} else {
						Editor.log("SAKit build complete! ⌘R refresh on open preview windows to get latest\n" + stdout);
					}
					resolve();
				}
			}
		);
	});
}

module.exports = {
	load () {
		// Due to insanity with how Mac applications get environment variables, process.env will almost never reflect
		//  variables set in the login shell. The following makes assumptions about environment setups and is not
		//  correct for non-Mac environments, but these PATH modifications might only be necessary on Macs and are
		//  currently only used for internal tools anyway
		// Additional reading: https://stackoverflow.com/questions/135688/setting-environment-variables-on-os-x
		if (process.env.PATH != null) {
			const PATH_ADDITIONS = [
				// Docker for casino_docker.php (SAKit Build)
				'/usr/local/bin',
				// Macports directories (hg)
				'/opt/local/bin',
				'/opt/local/sbin',
			];
			PATH_ADDITIONS.forEach((dir) => {
				if (process.env.PATH.indexOf(dir) === -1) {
					process.env.PATH += (":" + dir);
				}
			});
		}
	},

	unload () {
	},

	messages: {
		'build-sakit'(evt) {
			const callback = evt && evt.reply || function() {};
			buildSAKit()
			.then(() => {
				callback(null);
			})
			.catch(callback);
		},
	},
};