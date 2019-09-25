function show_summary(id) {
    var summaries = document.getElementById('summary_parent').childNodes;
    for (var i = 0; i < summaries.length; i++) {
        summaries[i].style.display = 'none';
    }
    document.getElementById('summary_' + id).style.display = 'block';
}

const vscode = acquireVsCodeApi();

function scroll_to(text_start, text_end) {
    vscode.postMessage(
        { 
            command: 'scroll',
            start: text_start,
            end: text_end
        });
}