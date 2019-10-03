"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class IPHandler {
    constructor(max_length = 20) {
        this.max_length = max_length;
        this.ip_addresses = this.parse_addresses(vscode.workspace.getConfiguration().get('indeni.commandRunnerIPHistory', []));
        console.log(this.ip_addresses);
    }
    set_ip_address(ip_address, server_name) {
        this.ip_addresses[ip_address] = server_name;
        this.save();
    }
    get_ip_addresses() {
        let result = [];
        for (let ip in this.ip_addresses) {
            result.push([ip, this.ip_addresses[ip]]);
        }
        return result;
    }
    parse_addresses(ip_addresses) {
        let result = {};
        for (let ip of ip_addresses) {
            if (ip.indexOf('=') > -1) {
                let key = ip.substring(0, ip.indexOf('=')).trim();
                let value = ip.substring(ip.indexOf('=') + 1).trim();
                result[key] = value;
            }
        }
        return result;
    }
    join_ip_addresses() {
        let result = [];
        for (let ip in this.ip_addresses) {
            let host = this.ip_addresses[ip];
            result.push(ip + '=' + host);
        }
        return result;
    }
    clear() {
        this.ip_addresses = {};
        this.save();
    }
    save() {
        let addr = this.join_ip_addresses();
        if (addr.length > this.max_length) {
            addr = addr.slice(0, this.max_length);
        }
        vscode.workspace.getConfiguration().update('indeni.commandRunnerIPHistory', addr, false);
    }
    parse(ip_string) {
        if (ip_string.indexOf('=') > -1) {
            let key = ip_string.substring(0, ip_string.indexOf('=')).trim();
            let value = ip_string.substring(ip_string.indexOf('=') + 1).trim();
            return [key, value];
        }
        return undefined;
    }
}
exports.IPHandler = IPHandler;
//# sourceMappingURL=IPHandler.js.map