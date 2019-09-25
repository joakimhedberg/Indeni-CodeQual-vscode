'use strict';

var noncompliant_validations = {};
var compliant_validations = {};
var noncompliant_table;
var compliant_table;
var details_table;
var compliant_list;
var noncompliant_list;
var details_header_item;

const vscode = acquireVsCodeApi();

function scroll_to(text_start, text_end) {
    vscode.postMessage(
        { 
            command: 'scroll',
            start: text_start,
            end: text_end
        });
}

window.onload = function() {
    let div = document.createElement('div');
    div.id = 'main_div';
    
    noncompliant_table = document.createElement('table');
    compliant_table = document.createElement('table');
    details_table = document.createElement('table');
    compliant_list = document.createElement('ul');
    noncompliant_list = document.createElement('ul');
    
    noncompliant_table.id = 'noncompliant_table';
    noncompliant_list.id = 'noncompliant_list';
    compliant_table.id = 'compliant_table';
    details_table.id = 'details_table';

    window.document.body.appendChild(div);
    div.appendChild(noncompliant_table);
    div.appendChild(details_table);
    div.appendChild(compliant_table);

    noncompliant_table.createTBody();
    compliant_table.createTBody();
    details_table.createTBody();

    let row = compliant_table.tBodies[0].insertRow();
    let cell = row.insertCell();
    cell.appendChild(compliant_list);

    let row2 = noncompliant_table.tBodies[0].insertRow();
    let cell2 = row2.insertCell();
    cell2.appendChild(noncompliant_list);

    create_header(noncompliant_table, 'Issues');
    create_header(compliant_table, 'No issues');
    details_header_item = create_header(details_table, 'Details');

    let detail_row = details_table.tHead.insertRow();
    let start_cell = document.createElement('th');
    let end_cell = document.createElement('th');
    detail_row.appendChild(start_cell);
    detail_row.appendChild(end_cell);

    start_cell.innerHTML = 'Start';
    end_cell.innerHTML = 'End';

    window.addEventListener('message', post_listener);
}

function create_header(table, text) {
    let body = table.createTHead();
    let row = body.insertRow();
    let cell = document.createElement('th');
    cell.setAttribute('colspan', '2');
    row.appendChild(cell);
    cell.innerHTML = text;

    return cell;
}

function insert_row(table, item) {
    let row = table.tBodies[0].insertRow();
    let cell1 = row.insertCell();
    let bullet = document.createElement('span');
    bullet.innerHTML = '&#11044;';
    bullet.className = item.severity;
    bullet.style.fontSize = '20px';

    let content = document.createElement('span');
    content.innerHTML = item.title;
    cell1.appendChild(bullet);
    cell1.appendChild(content);

    let cell2 = row.insertCell();
    cell2.innerHTML = item.tooltip;

    return row;
}


function insert_item(ul, item) {
    let li = document.createElement('li');
    let span = document.createElement('span');
    span.className = item.severity;
    span.innerHTML = '&#11044;';
    li.appendChild(span);
    li.appendChild(document.createTextNode(item.title));
    ul.appendChild(li);
    return li;
}

function post_listener(event) {
    let compliant = event.data.append_compliant;
    let noncompliant = event.data.append_noncompliant;
    
    if (event.data.clean) {
        compliant_list.innerHTML = '';
        //compliant_table.tBodies[0].rows[0].cells[0].innerHTML = '';
        noncompliant_list.innerHTML = '';
        details_header_item.innerHTML = 'Details';
        //noncompliant_table.tBodies[0].innerHTML = '';
        details_table.tBodies[0].innerHTML = '';
        noncompliant_validations = {};
        compliant_validations = {};
    }

    if (compliant !== undefined && !(compliant.id in compliant_validations)) {
        /*let li = document.createElement('li');
        let span = document.createElement('span');
        span.className = compliant.severity;
        span.innerHTML = '&#11044;';
        li.appendChild(span);
        li.appendChild(document.createTextNode(compliant.title));
        compliant_list.appendChild(li);*/
        insert_item(compliant_list, compliant);
        //insert_row(compliant_table, compliant);
        compliant_validations[compliant.id] = compliant;
    } else if (noncompliant !== undefined && !(noncompliant.id in noncompliant_validations)) {
        /*let row = insert_row(noncompliant_table, noncompliant)
        row.onclick = function() { handle_row_click(noncompliant.id) };*/
        
        let li = insert_item(noncompliant_list, noncompliant);
        li.onclick = function() { handle_row_click(noncompliant.id) };
        li.className = li.className + " clickable";
        /*let li = document.createElement('li');
        let span = document.createElement('span');
        span.className = noncompliant.severity;
        span.innerHTML = '&#11044;';
        li.appendChild(span);
        li.appendChild(document.createTextNode(noncompliant.title));
        noncompliant_list.appendChild(li);
        li.onclick = function() { handle_row_click(noncompliant.id) };*/

        noncompliant_validations[noncompliant.id] = noncompliant;
    }

}

function handle_row_click(index) {
    details_table.tBodies[0].innerHTML = '';
    let validation = noncompliant_validations[index];
    if (validation !== undefined) {
        details_header_item.innerHTML = 'Details: ' + validation.title;
        for (let marker of validation.markers) {
            let marker_row = details_table.tBodies[0].insertRow();
            marker_row.className = marker_row.className + " clickable";
            let start_pos = marker_row.insertCell();
            let end_pos = marker_row.insertCell();
            start_pos.innerHTML = marker.start_pos;
            end_pos.innerHTML = marker.end_pos;
            
            marker_row.onclick = function() { scroll_to(marker.start_pos, marker.end_pos); }
        }
    }
}