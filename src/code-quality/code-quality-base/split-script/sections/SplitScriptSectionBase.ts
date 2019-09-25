import { readFileSync } from "fs";

export abstract class SplitScriptSectionBase
{
    public filename : string;
    public section_identifier : string;
    private _content : string  | undefined;
    public content_type : string;

    private comment_lines : [number, string][];
    private quotes : [number, string][];
    private regexp  : [number, string][];

    constructor(filename : string, identifier : string, content_type : string, content : string | undefined = undefined) {
        this.filename = filename;
        this.content_type = content_type;
        this.section_identifier = identifier;
        this._content = content;
        this.comment_lines = [];
        this.quotes = [];
        this.regexp = [];
    }

    get content() {
        if (this._content === undefined) {
            try
            {
                this._content = readFileSync(this.filename).toString();
            } catch (error) {
                console.error(error);
            }
        }


        if (this._content) {
            let quotes_match = /(["'])(?:(?=(\\?))\2.)*?\1/gm;
            let regex_match = /([/])(?:(?=(\\?))\2.)*?\1/gm;
            let comments_match = /#.*$/gm;

            let match;
            while (match = quotes_match.exec(this._content)) {
                this.quotes.push([match.index, match[0]]);
            }

            while (match = regex_match.exec(this._content)) {
                this.regexp.push([match.index, match[0]]);
            }

            while (match = comments_match.exec(this._content)) {
                this.comment_lines.push([match.index, match[0]]);
            }
        }

        return this._content;
    }

    public abstract get_metrics() : [number, string][];

    public is_in_comment(start_pos : number, end_pos : number, comparison : IsInComparison) : boolean {
        return this.is_in_list(this.comment_lines, start_pos, end_pos, comparison);
    }

    public is_in_quote(start_pos : number, end_pos : number, comparison : IsInComparison) : boolean {
        return this.is_in_list(this.quotes, start_pos, end_pos, comparison);
    }

    public is_in_regexp(start_pos : number, end_pos : number, comparison : IsInComparison) : boolean {
        return this.is_in_list(this.regexp, start_pos, end_pos, comparison);
    }

    is_in_list(list : [number, string][], start_pos : number, end_pos : number, comparison : IsInComparison) : boolean {
        for (let item of list) {
            if (this.range_match(item, start_pos, end_pos, comparison)) {
                return true;
            }
        }

        return false;
    }

    range_match(item : [number, string], start_pos : number, end_pos : number, comparison : IsInComparison) : boolean {
        switch (comparison) {
            case IsInComparison.any_within:
                return this.is_in_range(item[0], item[0] + item[1].length, start_pos) || this.is_in_range(item[0], item[0] + item[1].length, end_pos);
            case IsInComparison.both_within:
                return this.is_in_range(item[0], item[0] + item[1].length, start_pos) && this.is_in_range(item[0], item[0] + item[1].length, end_pos);
            case IsInComparison.start_within:
                return this.is_in_range(item[0], item[0] + item[1].length, start_pos);
            case IsInComparison.end_within:
                return this.is_in_range(item[0], item[0] + item[1].length, end_pos);
        }

        return false;
    }

    is_in_range(range_start : number, range_end : number, index : number) {
        return range_start <= index && index <= range_end;
    }
}

export enum IsInComparison {
    both_within,
    start_within,
    end_within,
    any_within
}