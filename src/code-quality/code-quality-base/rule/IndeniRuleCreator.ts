import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export class IndeniRuleCreator {
    private workspace_path : string;
    private templates_yaml_to_scala : {[ yaml_name : string ] : string };
    private templates_scala_to_yaml : {[ scala_name : string ] : string };
    private fields_scala_to_yaml : {[scala_name : string] : string};
    private fields_yaml_to_scala : {[yaml_name : string] : string};
    
    public rule_templates : { [scala_name : string ] : IndeniYamlRule };

    private templates_regex = /case\s\"(\w+)\"\s+=>\s+(\w+)/gm;
    private fields_regex = /val ([^\s]+)\s=\s\"([^"]+)/gm;

    public constructor(workspace_path : string) {
        this.workspace_path = workspace_path;
        this.templates_yaml_to_scala = {};
        this.templates_scala_to_yaml = {};
        this.fields_scala_to_yaml = {};
        this.fields_yaml_to_scala = {};
        this.rule_templates = {};
    }

    public async load() : Promise<void> {
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
    }

    private load_rule_templates() : boolean {
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

    private load_template_names() : boolean {
        let templates_file_path = path.join(this.workspace_path, 'rules/sync_core_rules/yamlrules/YamlRuleProcessor.scala');

        let data = this.load_file_text(templates_file_path);
        if (data === undefined) {
            return false;
        }
        let result  = false;
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

    private load_field_names() : boolean {
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

    private load_file_text(filename : string) : string | undefined {
        if (!fs.existsSync(filename)) {
            return undefined;
        }
        try {
            let data = fs.readFileSync(filename, { encoding: 'utf-8' });
            return data;
        } catch(err) {
            return undefined;
        }
    }

    public async get_yaml_rule() : Promise<string> {
        let items : string[] = [];
        for (let key in this.rule_templates) {
            items.push(key);
        }
        let data = await vscode.window.showQuickPick(items, { canPickMany: false, ignoreFocusOut: true, placeHolder: 'Select template' });
        if (data === undefined) {
            return Promise.reject('Operation cancelled');
        }

        let name = await vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: 'Rule name, CamelCase with Rule as suffix, ie FortinetDiskLoggingRule', prompt: 'Enter rule name', validateInput: this.validate_rule_name });
        if (name === undefined) {
            return Promise.reject('Invalid rule name');
        }

        let metric_name = await vscode.window.showInputBox( { ignoreFocusOut: true, placeHolder: 'Metric name', prompt: 'Enter metric name'});

        let template = this.rule_templates[data];

        return Promise.resolve(template.generate_yaml(this.templates_scala_to_yaml, this.fields_scala_to_yaml, name, metric_name));
    }

    private validate_rule_name(name : string) : string | null {
        if (/[A-Za-z]+Rule$/g.test(name)) {
            return null;
        }

        return 'CamelCase with Rule suffix, ie FortinetDiskLoggingRule';
    }
}

export class IndeniYamlRule {
    public template_name : string = '';
    public fields : string[] = [];

    public mandatory_fields : { [field_name : string] : boolean } = {};

    public load(data : string) : boolean {
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

            for (let field of fields_arr)  {
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

    public generate_yaml(scala_template_to_yaml : { [key : string] : string}, scala_field_to_yaml : { [key : string] : string}, rule_name : string, metric_name : string | undefined) {
        let output : string[] = [];
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
            } else if (field_name === 'metric_name') {
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