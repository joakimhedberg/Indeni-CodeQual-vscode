'use strict';
const vscode = acquireVsCodeApi();
var main_div;
var test_cases_table;
var raw_output_div;
var current_data = {};
var parse_result = undefined;

window.onload = function() {
    main_div = document.createElement('div');
    test_cases_table = window.document.createElement('table');
    raw_output_div = document.createElement('div');
    window.document.body.appendChild(main_div);
    main_div.appendChild(test_cases_table);

    window.document.body.appendChild(raw_output_div);
    
    create_header(test_cases_table, 'Test cases');
    test_cases_table.createTBody();
    window.addEventListener('message', post_parse_listener);
}


function create_header(table, main_title, row_columns) {
    let header = table.createTHead();
    
    if (main_title !== null) {
        let row1 = header.insertRow();
        let th_main = document.createElement('th');
        th_main.innerHTML = main_title;
        row1.appendChild(th_main);
    }
    if (row_columns) {
        let row2 = header.insertRow();
        for (let col of row_columns) {
            let th_col1 = document.createElement('th');
            th_col1.appendChild(document.createTextNode(col));
            row2.appendChild(th_col1);
        }
    }
    
}

function post_parse_listener(event) {
    parse_result = event.data.present_test_result;
    load_result();
}

function load_result() {
    test_cases_table.tBodies[0].innerHTML = '';
    raw_output_div.innerHTML = '';

    if (parse_result !== undefined) {
        for (let test_case of parse_result.test_cases) {
            let row = test_cases_table.tBodies[0].insertRow();

            let name_cell = row.insertCell();
            name_cell.innerHTML = test_case.name;
            name_cell.style.background = test_case.success? 'darkgreen': 'maroon';
            name_cell.style.fontWeight = 'bold';
            name_cell.style.padding = '3px';
            name_cell.style.color = 'white';

            if (!test_case.success) {
                let row = test_cases_table.insertRow();
                create_test_case_result(row, test_case);
            }
        }
        
        let raw_title = document.createElement('span');
        raw_title.innerHTML = 'Raw output';
        raw_title.className = 'title';
        raw_output_div.appendChild(raw_title);
        let pre_raw = document.createElement('pre');
        pre_raw.innerHTML = parse_result.raw_data_stripped;
        raw_output_div.appendChild(pre_raw);
    }
}

function create_test_case_result(row, test_case) {
    let table_expected_metrics = document.createElement('table');
    let table_got_metrics = document.createElement('table');
    
    row.appendChild(table_expected_metrics);
    create_header(table_expected_metrics, 'Expected', ['Name', 'Tags', 'Value']);
    row.appendChild(table_got_metrics);
    create_header(table_got_metrics, 'But got', ['Name', 'Tags', 'Value']);
    table_expected_metrics.createTBody();
    table_got_metrics.createTBody();
   
    table_expected_metrics.className = 'metric_table';
    table_got_metrics.className = 'metric_table';

    table_expected_metrics.id = 'expected_metrics_table';
    table_got_metrics.id = 'got_metrics_table';
    
    add_metrics_to_table(table_expected_metrics, test_case.expected_metrics);
    add_metrics_to_table(table_got_metrics, test_case.got_metrics);
    
    if (test_case.added_metrics.length > 0) {
        let table_added_metrics = document.createElement('table');
        table_added_metrics.createTBody();
        row.appendChild(table_added_metrics);
        create_header(table_added_metrics, 'Added', ['Name', 'Tags', 'Value']);
        table_added_metrics.className = 'metric_table';
        table_added_metrics.id = 'added_metrics_table';

        add_metrics_to_table(table_added_metrics, test_case.added_metrics);
    }

    if (test_case.removed_metrics.length > 0) {
        let table_removed_metrics = document.createElement('table');
        row.appendChild(table_removed_metrics);
        create_header(table_removed_metrics, 'Removed', ['Name', 'Tags', 'Value'])
        table_removed_metrics.className = 'metric_table';
        table_removed_metrics.createTBody();
        table_removed_metrics.id = 'removed_metrics_table';
        add_metrics_to_table(table_removed_metrics, test_case.removed_metrics);
    }
    
    if (test_case.metric_delta.length > 0) {
        let table_delta_metrics = document.createElement('table');    
        row.appendChild(table_delta_metrics);
        create_header(table_delta_metrics, 'Delta', ['Name 1', 'Name 2', 'Tags', 'Old value', 'New value']);
        table_delta_metrics.className = 'metric_table';
        table_delta_metrics.createTBody();
        table_delta_metrics.id = 'delta_metrics_table';

        for (let item of test_case.metric_delta) {
            let row = table_delta_metrics.insertRow();

            let cell_name1 = row.insertCell();
            let cell_name2 = row.insertCell();
            let cell_tags1 = row.insertCell();
            let cell_value1 = row.insertCell();
            let cell_value2 = row.insertCell();

            cell_name1.innerHTML = item.name1 === undefined? '': item.name1;
            cell_name2.innerHTML = item.name2 === undefined? '': item.name2;

            let table_tags_delta = document.createElement('table');
            create_header(table_tags_delta, null, ['Old name', 'Old value', 'New name', 'New value']);

            cell_tags1.appendChild(table_tags_delta);

            for (let tag of item.tags) {
                let row = table_tags_delta.insertRow();
                let cell_1 = row.insertCell();
                let cell_2 = row.insertCell();
                let cell_3 = row.insertCell();
                let cell_4 = row.insertCell();

                cell_1.innerHTML = tag.name === undefined? '': tag.name;
                cell_2.innerHTML = tag.value === undefined? '': tag.value;
                cell_3.innerHTML = tag.name2 === undefined? '': tag.name2;
                cell_4.innerHTML = tag.value2 === undefined? '': tag.value2;

                if (tag.name !== tag.name2) {
                    cell_1.style.background = 'maroon';
                    cell_3.style.background = 'maroon';
                }

                if (tag.value !== tag.value2) {
                    cell_2.style.background = 'maroon';
                    cell_4.style.background = 'maroon';
                }
            }

            cell_value1.innerHTML = item.value1 === undefined? '': item.value1;
            cell_value2.innerHTML = item.value2 === undefined? '': item.value2;
        }
    }

}

function add_metrics_to_table(table, metrics) {
    for (let metric of metrics) {
        let row = table.tBodies[0].insertRow();
        let name_cell = row.insertCell();
        let tags_cell = row.insertCell();
        let value_cell = row.insertCell();

        name_cell.innerHTML = metric.name === undefined? '': metric.name;
        let pre = document.createElement('pre');
        pre.innerHTML = metric.value === undefined? '': metric.value;
        value_cell.appendChild(pre);

        for (let tag of metric.tags) {
            tags_cell.appendChild(document.createTextNode(tag.name + ' = ' + tag.value));
            tags_cell.appendChild(document.createElement('br'));
        }
    }
}