"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiver = archiver;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function archiver(zipPath, files, format, options) {
    const command = format === 'zip' ? `zip -r ${zipPath}` : `tar ${options?.gzip ? '-czf' : '-cf'} ${zipPath}`;
    const fileList = files.map(file => `"${file}"`).join(' ');
    const fullCommand = `${command} ${fileList}`;
    const result = await execAsync(fullCommand, { maxBuffer: 1024 * 1024 * 10 }); // Increase buffer size if needed
    return result.stdout;
}
exports.default = archiver;
//# sourceMappingURL=archiver.helper.js.map