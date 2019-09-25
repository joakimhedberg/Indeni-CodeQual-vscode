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
const fs = require("fs");
class RuleInputBuilder {
    from_time_series_output(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let data = fs.readFileSync(filename, { encoding: 'utf-8' });
                try {
                    let json = JSON.parse(data);
                    if (json['type'] !== 'monitoring') {
                        reject('This only works with monitoring output');
                        return;
                    }
                    let output_data = [];
                    output_data.push('devices:');
                    output_data.push(this.get_indent(1) + 'device-a:');
                    output_data.push(this.get_indent(2) + 'metrics:');
                    for (let res of json['result']) {
                        this.push_metric(output_data, res);
                    }
                    resolve(output_data.join('\n'));
                }
                catch (error) {
                    reject(error);
                    return;
                }
            });
        });
    }
    push_metric(arr, res) {
        if (res['type'] === 'ts') {
            this.push_timeseries_metric(arr, res);
        }
        else if (res['type'] === 'snapshot') {
            this.push_snapshot_metric(arr, res);
        }
    }
    push_snapshot_metric(arr, res) {
        arr.push(this.get_indent(3) + '-');
        arr.push(this.get_indent(4) + 'type: snapshot');
        arr.push(this.get_indent(4) + 'name: ' + res['tags']['im.name']);
        arr.push(this.get_indent(4) + 'tags:');
        for (let tag in res['tags']) {
            if (tag !== 'im.name') {
                arr.push(this.get_indent(5) + tag + ': ' + res['tags'][tag]);
            }
        }
        arr.push(this.get_indent(4) + 'data:');
        arr.push(this.get_indent(5) + 'most-recent:');
        if (Array.isArray(res['value'])) {
            arr.push(this.get_indent(6) + 'multi:');
            for (let item of res['value']) {
                arr.push(this.get_indent(7) + '-');
                for (let key in item) {
                    arr.push(this.get_indent(8) + key + ': ' + item[key]);
                }
            }
        }
        else {
            arr.push(this.get_indent(6) + 'single:');
            for (let key in res['value']) {
                arr.push(this.get_indent(7) + key + ': ' + res['value'][key]);
            }
        }
    }
    push_timeseries_metric(arr, res) {
        arr.push(this.get_indent(3) + '-');
        arr.push(this.get_indent(4) + 'type: ts');
        arr.push(this.get_indent(4) + 'name: ' + res['tags']['im.name']);
        arr.push(this.get_indent(4) + 'tags:');
        for (let tag in res['tags']) {
            if (tag !== 'im.name') {
                arr.push(this.get_indent(5) + tag + ': ' + res['tags'][tag]);
            }
        }
        arr.push(this.get_indent(4) + 'data: [' + res['value'] + ']');
    }
    get_indent(indent) {
        let result = '';
        indent = indent * 4;
        for (let i = 0; i < indent; i++) {
            result += ' ';
        }
        return result;
    }
}
exports.RuleInputBuilder = RuleInputBuilder;
/*
devices:
    device-a: # device ID
        tags: # device's tags
            x: y
            n: 1
            n2: 2.0
            b: true
        metrics: # device's metrics
            -
                type: ts # time-series / double metric
                name: cpu-usage1 # im.type
                tags: # metrics' tags (optional)
                    cpu-id: 1
                data: [1, 1, null, 2.0] # the time-series points. First is the oldest while last is the latest.
                */ 
//# sourceMappingURL=RuleInputBuilder.js.map