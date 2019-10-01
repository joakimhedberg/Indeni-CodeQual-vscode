"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");
class IndeniRuleCreator {
    constructor(workspace_path) {
        this.templates_regex = /case\s\"(\w+)\"\s+=>\s+(\w+)/gm;
        this.fields_regex = /val ([^\s]+)\s=\s\"([^"]+)/gm;
        this.workspace_path = workspace_path;
        this.templates_yaml_to_scala = {};
        this.templates_scala_to_yaml = {};
        this.fields_scala_to_yaml = {};
        this.fields_yaml_to_scala = {};
        this.rule_templates = {};
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.load_field_names()) {
                return Promise.reject('Unable to load field names');
            }
            if (!this.load_template_names()) {
                return Promise.reject('Unable to load template names');
            }
            if (!this.load_rule_templates()) {
                return Promise.reject('Unable to load rule templates');
            }
            return Promise.resolve();
        });
    }
    load_rule_templates() {
        let result = false;
        let rule_templates_file_path = path.join(this.workspace_path, 'rules/sync_core_rules/templates/');
        for (let fn of fs.readdirSync(rule_templates_file_path)) {
            if (fn.endsWith('.scala')) {
                let filename = path.join(rule_templates_file_path, fn);
                let data = this.load_file_text(filename);
                if (data !== undefined) {
                    let rule = new IndeniYamlRule();
                    if (rule.load(data)) {
                        result = true;
                        this.rule_templates[rule.template_name] = rule;
                    }
                }
            }
        }
        return result;
    }
    load_template_names() {
        let templates_file_path = path.join(this.workspace_path, 'rules/sync_core_rules/yamlrules/YamlRuleProcessor.scala');
        let data = this.load_file_text(templates_file_path);
        if (data === undefined) {
            return false;
        }
        let result = false;
        let match;
        while (match = this.templates_regex.exec(data)) {
            if (match.length >= 2) {
                this.templates_yaml_to_scala[match[1]] = match[2];
                this.templates_scala_to_yaml[match[2]] = match[1];
                result = true;
            }
        }
        return result;
    }
    load_field_names() {
        let fields_file_path = path.join(this.workspace_path, 'rules/sync_core_rules/yamlrules/YamlRuleProcessorUtils.scala');
        let data = this.load_file_text(fields_file_path);
        if (data === undefined) {
            return false;
        }
        let result = false;
        let match;
        while (match = this.fields_regex.exec(data)) {
            if (match.length >= 2) {
                this.fields_scala_to_yaml[match[1]] = match[2];
                this.fields_yaml_to_scala[match[2]] = match[2];
                result = true;
            }
        }
        return result;
    }
    load_file_text(filename) {
        if (!fs.existsSync(filename)) {
            return undefined;
        }
        try {
            let data = fs.readFileSync(filename, { encoding: 'utf-8' });
            return data;
        }
        catch (err) {
            return undefined;
        }
    }
    get_yaml_rule() {
        return __awaiter(this, void 0, void 0, function* () {
            let items = [];
            for (let key in this.rule_templates) {
                items.push(key);
            }
            let data = yield vscode.window.showQuickPick(items, { canPickMany: false, ignoreFocusOut: true, placeHolder: 'Select template' });
            if (data === undefined) {
                return Promise.reject('Operation cancelled');
            }
            let name = yield vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: 'Rule name, CamelCase with Rule as suffix, ie FortinetDiskLoggingRule', prompt: 'Enter rule name', validateInput: this.validate_rule_name });
            if (name === undefined) {
                return Promise.reject('Invalid rule name');
            }
            let metric_name = yield vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: 'Metric name', prompt: 'Enter metric name' });
            let template = this.rule_templates[data];
            return Promise.resolve(template.generate_yaml(this.templates_scala_to_yaml, this.fields_scala_to_yaml, name, metric_name));
        });
    }
    validate_rule_name(name) {
        if (/[A-Za-z]+Rule$/g.test(name)) {
            return null;
        }
        return 'CamelCase with Rule suffix, ie FortinetDiskLoggingRule';
    }
}
exports.IndeniRuleCreator = IndeniRuleCreator;
class IndeniYamlRule {
    constructor() {
        this.template_name = '';
        this.fields = [];
        this.mandatory_fields = {};
    }
    load(data) {
        let regexp_fields = /fromYaml.+val AllFields\s+=\s+Set\((.*?)\)/gs;
        let regexp_name = /object\s+(\w+)/gs;
        let regexp_optional = /readOptional\w*\(.*?\,\s+(\w+)/g;
        let regexp_mandatory = /readMandatory\w*\(.*?\,\s+(\w+)/g;
        let match = regexp_name.exec(data);
        if (match && match.length > 0) {
            this.template_name = match[1];
        }
        else {
            return false;
        }
        match = regexp_fields.exec(data);
        if (match && match.length > 0) {
            let fields_string = match[1].trim();
            let fields_arr = fields_string.split(',');
            for (let field of fields_arr) {
                this.fields.push(field.trim());
            }
        }
        else {
            return false;
        }
        while (match = regexp_optional.exec(data)) {
            this.mandatory_fields[match[1].trim()] = false;
        }
        while (match = regexp_mandatory.exec(data)) {
            this.mandatory_fields[match[1].trim()] = true;
        }
        return true;
    }
    generate_yaml(scala_template_to_yaml, scala_field_to_yaml, rule_name, metric_name) {
        let output = [];
        console.log(this.mandatory_fields);
        output.push('rule_type: template-based');
        output.push('template_name: ' + scala_template_to_yaml[this.template_name]);
        if (metric_name === undefined) {
            metric_name = '';
        }
        for (let field of this.fields) {
            let field_name = scala_field_to_yaml[field];
            if (field_name === 'rule_name') {
                output.push(field_name + ": " + rule_name);
            }
            else if (field_name === 'metric_name') {
                output.push('metric_name: ' + metric_name);
            }
            else {
                let optional = '';
                if (this.mandatory_fields[field] === false) {
                    optional = '#';
                }
                output.push(optional + field_name + ': ');
            }
        }
        return output.join('\n');
    }
}
exports.IndeniYamlRule = IndeniYamlRule;
//# sourceMappingURL=IndeniRuleCreator.js.map