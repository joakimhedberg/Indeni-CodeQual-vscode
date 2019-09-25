"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const Section_1 = require("./Section");
class SplitScript {
    constructor(fullpath, content) {
        // Current file content
        this.content = content;
        // Full path to the file
        this.fullpath = fullpath;
        // Full filename without the path
        this.filename = '';
        // File extension(might be multiple)
        this.extension = '';
        // File name without extension
        this.basename = '';
        // Full file path without extension
        this.basepath = '';
        // Files that share the same basepath
        this.siblings = [];
        let filematch = fullpath.match(/([^\\/]+)$/g);
        if (filematch) {
            this.filename = filematch[0];
        }
        let basematch = fullpath.match(/^([^.]+)/g);
        if (basematch) {
            this.basepath = basematch[0];
        }
        let filename_split = this.filename.split('.');
        if (filename_split.length > 0) {
            this.basename = filename_split[0];
            filename_split.splice(0, 1);
            if (filename_split.length > 0) {
                this.extension = filename_split.join('.');
            }
        }
        this.path = this.fullpath.substring(0, this.fullpath.length - this.filename.length);
        for (let filename of fs_1.readdirSync(this.path)) {
            let fname_split = filename.split('.');
            if (fname_split.length > 0) {
                if (fname_split[0] === this.basename) {
                    this.siblings.push(filename);
                }
            }
        }
        this.load_sections();
    }
    load_sections() {
        let current = new Section_1.Section(0, this.content, []);
        if (this.filename.endsWith('.yaml')) {
            this.current_section = new Section_1.YamlSection(current);
        }
        else if (this.filename.endsWith('.awk')) {
            this.current_section = new Section_1.AwkSection(current);
        }
    }
}
exports.SplitScript = SplitScript;
//# sourceMappingURL=SplitScript.js.map