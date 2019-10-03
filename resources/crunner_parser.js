'use strict';
const vscode = acquireVsCodeApi();
var main_div;
var parser_header;
var script_filename_cell;
var input_filename_cell;
var duration_cell;
var size_cell;
var metric_count_cell;
var metrics_table;
var raw_output_div;
var parse_result = undefined;
var debug_lines_div;

var remote_content_button;


function remote_content_clicked() {
    if (parse_result === undefined) {
        console.log('No parse result');
        return;
    }
    vscode.postMessage(
        { 
            command: 'show_data',
            data: parse_result.remote_contents
        });
}

window.onload = function() {
    main_div = document.createElement('div');
    main_div.id = 'main_div';
    raw_output_div = document.createElement('div');
    debug_lines_div = document.createElement('div');
    window.document.body.appendChild(main_div);
    window.document.body.appendChild(raw_output_div);

    parser_header = document.createElement('table');
    let cell = append_header_cell(parser_header, 'Script filename');
    script_filename_cell = document.createElement('div');
    cell.appendChild(script_filename_cell);
    
    cell = append_header_cell(parser_header, 'Input filename');
    input_filename_cell = document.createElement('div');
    cell.appendChild(input_filename_cell);

    size_cell = append_header_cell(parser_header, 'Size');
    duration_cell = append_header_cell(parser_header, 'Duration');
    metric_count_cell = append_header_cell(parser_header, 'Metrics');

    metrics_table = document.createElement('table');
    
    main_div.appendChild(parser_header);
    main_div.appendChild(metrics_table);
    remote_content_button = document.createElement('input');
    remote_content_button.type = 'button';  
    remote_content_button.style = 'width: 200px; height: 40px';
    remote_content_button.value = 'Show remote data';
    remote_content_button.style.visibility = 'hidden';
    remote_content_button.onclick = function() { remote_content_clicked(); }
    main_div.appendChild(remote_content_button);
    main_div.appendChild(debug_lines_div);

    var header = metrics_table.createTHead();
    let metrics_row = header.insertRow();
    let metrics_header = document.createElement('th');
    metrics_header.colSpan = 3;
    metrics_header.appendChild(document.createTextNode('Metrics'));
    metrics_row.appendChild(metrics_header);
    let header_row = header.insertRow();

    let th_name = document.createElement('th');
    let th_tags = document.createElement('th');
    let th_value = document.createElement('th');
    th_name.appendChild(document.createTextNode('Name'));
    th_tags.appendChild(document.createTextNode('Tags'));
    th_value.appendChild(document.createTextNode('Value'));
    header_row.appendChild(th_name);
    header_row.appendChild(th_tags);
    header_row.appendChild(th_value);
    metrics_table.createTBody();
    window.addEventListener('message', post_parse_listener);
}

function append_header_cell(table, text) {
    let row = table.insertRow();
    let cell = row .insertCell();
    cell.appendChild(document.createTextNode(text));
    cell.className = 'title_text';
    return row.insertCell();
}

function post_parse_listener(event) {
    parse_result = event.data.present_parser_result;
    load_result();
}

function load_result() {
    script_filename_cell.innerHTML = '';
    input_filename_cell.innerHTML = '';
    metrics_table.tBodies[0].innerHTML = '';
    raw_output_div.innerHTML = '';
    debug_lines_div.innerHTML = '';
    
    if (parse_result !== undefined) {
        script_filename_cell.appendChild(document.createTextNode(parse_result.script_file_name));
        create_tooltip(script_filename_cell, parse_result.script_path);
        input_filename_cell.appendChild(document.createTextNode(parse_result.input_file_name));
        create_tooltip(input_filename_cell, parse_result.input_path);

        size_cell.innerHTML = parse_result.size + ' ' + parse_result.size_unit;
        duration_cell.innerHTML = (parse_result.duration === undefined? '': parse_result.duration + ' ms');
        metric_count_cell.innerHTML = parse_result.metrics.length;
        if (parse_result.metrics.length <= 0) 
        {
            metrics_table.style.visibility = 'hidden';
        }
        else {
            metrics_table.style.visibility = 'visible';
        }
        for (let metric of parse_result.metrics) {
            let row = metrics_table.tBodies[0].insertRow();
            let name_cell = row.insertCell();
            let tags_cell = row.insertCell();
            let value_cell = row.insertCell();

            name_cell.innerHTML = metric.name;
            let pre = document.createElement('pre');
            pre.innerHTML = metric.value;
            value_cell.appendChild(pre);

            
            for (let tag of metric.tags) {
                tags_cell.appendChild(document.createTextNode(tag.name + ' = ' + tag.value));
                tags_cell.appendChild(document.createElement('br'));
            }
        }
        let raw_title = document.createElement('span');
        raw_title.innerHTML = 'Raw output';
        raw_title.className = 'title';
        raw_output_div.appendChild(raw_title);
        let pre_raw = document.createElement('pre');
        pre_raw.innerHTML = parse_result.raw_data_stripped;
        raw_output_div.appendChild(pre_raw);

        if (parse_result.tags.length > 0) 
        {
            let tags_table = document.createElement('table');
            let tags_header = tags_table.createTHead();
            
            let th_title = document.createElement('th');
            th_title.innerHTML = 'Tags';
            let th_name = document.createElement('th');
            let th_value = document.createElement('th');

            let tags_row = tags_header.insertRow();
            tags_row.appendChild(th_title);
            let tags_row2 = tags_header.insertRow();
            tags_row2.appendChild(th_name);
            tags_row2.appendChild(th_value);
            tags_table.createTBody();

            main_div.appendChild(tags_table);
            for (let tag of parse_result.tags) {
                let row = tags_table.tBodies[0].insertRow();
                let cell_name = row.insertCell();
                let cell_value = row.insertCell();

                cell_name.innerHTML = tag.name === undefined? '': tag.name;
                cell_value.innerHTML = tag.value === undefined? '': tag.value;

            }
        }

        if (parse_result.debug_lines) {
            let debug_title = document.createElement('span');
            debug_title.innerHTML = 'Debug lines';
            debug_title.className = 'title';
            debug_lines_div.appendChild(debug_title);
            let debug_lines_pre = document.createElement('pre');
            debug_lines_div.appendChild(debug_lines_pre);
            
            debug_lines_pre.innerHTML = parse_result.debug_lines.join('\n');
        };

        remote_content_button.style.visibility = (parse_result.remote_contents !== undefined) && (parse_result.remote_contents.length > 0)? 'visible': 'hidden';
    }
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