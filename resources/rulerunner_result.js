'use strict';
const vscode = acquireVsCodeApi();
var main_div;

var result_header_table;
var devices_table;

var error_output_pre;
var error_output_div;

var raw_output_div;
var raw_output_pre;
var rulerunner_result = undefined;

window.onload = function() {
    main_div = document.createElement('div');
    main_div.id = 'main_div';
    raw_output_div = document.createElement('div');
    raw_output_pre = document.createElement('pre');

    error_output_div = document.createElement('div');
    error_output_div.id = 'error_output_div';
    error_output_pre = document.createElement('pre');
    
    error_output_div.appendChild(error_output_pre);

    raw_output_div.appendChild(raw_output_pre);
    result_header_table = document.createElement('table');
    result_header_table.createTHead();
    append_header_cell(result_header_table.tHead, 'Result');
    result_header_table.createTBody();
    main_div.appendChild(result_header_table);
    devices_table = document.createElement('table');
    main_div.appendChild(devices_table);
    devices_table.createTHead();
    append_header_cell(devices_table, 'Devices');
    devices_table.createTBody();

    window.document.body.appendChild(main_div);
    main_div.appendChild(error_output_div);
    window.document.body.appendChild(raw_output_div);

    window.addEventListener('message', post_rulerunner_result_listener);
}

function append_header_cell(table, text) {
    let row = table.insertRow();
    let cell = row .insertCell();
    cell.appendChild(document.createTextNode(text));
    cell.className = 'title_text';
    return row.insertCell();
}

function post_rulerunner_result_listener(event) {
    rulerunner_result = event.data.present_rulerunner_result;
    load_result();
}

function load_result() {
    result_header_table.tBodies[0].innerHTML = '';
    raw_output_pre.innerHTML = '';
    error_output_pre.innerHTML = '';
    error_output_div.style.visibility = 'hidden';

    devices_table.tBodies[0].innerHTML = '';
    if (rulerunner_result !== undefined) {
        if (rulerunner_result.has_error) {
            error_output_pre.innerHTML = rulerunner_result.error_data;
            error_output_div.style.visibility = 'visible';
        }
        for (let item of rulerunner_result.items) {
            let row = result_header_table.tBodies[0].insertRow();
            let cell1 = row.insertCell();
            let cell2 = row.insertCell();

            cell1.appendChild(document.createTextNode(item[0]));
            cell2.appendChild(document.createTextNode(item[1]));
        }

        for (let device_name in rulerunner_result.device_status) {
            let device_value = rulerunner_result.device_status[device_name];
            let row = devices_table.tBodies[0].insertRow();
            let cell1 = row.insertCell();
            let cell2 = row.insertCell();

            cell1.appendChild(document.createTextNode(device_name));
            if (device_value === false) {
                cell2.appendChild(document.createTextNode('Unknown status'));
            } else if (device_value === true) {
                cell2.appendChild(document.createTextNode('No alert'));
            }
            else {
                insert_device_status(cell2, device_value);
            }
        }

        raw_output_pre.innerHTML = rulerunner_result.raw_data_stripped;
    }
}

function insert_device_status(cell, value) {
    let pre = document.createElement('pre');
    pre.innerHTML = value.issue_data;
    cell.appendChild(pre);
}

function create_tooltip(item, tooltip_text) {
    if (item.className.indexOf('tooltip') < 0) {
        item.className += ' tooltip';
    }

    let span = document.createElement('span');
    item.appendChild(span);
    span.className = 'tooltiptext';
    span.appendChild(document.createTextNode(tooltip_text));
}