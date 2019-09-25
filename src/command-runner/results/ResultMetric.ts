export class ResultMetric
{
    public name : string | undefined = undefined;
    public tags : ResultMetricTag[] = [];
    public value : any;
    public raw_data : string | undefined = undefined;

    public matches(other : ResultMetric) : boolean {
        if (this.name !== other.name) {
            return false;
        }

        for (let tag of this.tags) {
            let found = false;
            for (let othertag of other.tags) {
                if (tag.name === othertag.name && tag.value === othertag.value) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        return true;
    }

    public compare_points(other : ResultMetric) : number {
        let result = -1;
        if (this.name !== other.name) {
            return result;
        }
        result++;

        if (this.value === other.value) {
            result++;
        }

        for (let tag of this.tags) {
            for (let tag2 of other.tags) {
                if (tag.name === tag2.name) {
                    result++;
                }
                if (tag.value === tag2.value) {
                    result++;
                }
            }
        }

        return result;
    }

    //DoubleMetric(Map(im.dstype -> gauge, im.dstype.displaytype -> state, im.name -> ntp-is-synchronized, live-config -> true, display-name -> NTP Synchronization Status),1.0,0)
    //ComplexMetric(Map(im.name -> arp-table),[{"success":"1","interface":"0:0","mac":"00:0c:29:0a:db:a3","targetip":"10.3.3.71"},{"success":"1","targetip":"10.3.3.72","interface":"0:0","mac":"00:0c:29:0a:db:a3"},{"targetip":"10.3.3.29","interface":"0:0","success":"1","mac":"00:1b:17:00:3e:11"},{"mac":"00:50:56:80:1a:54","interface":"0:0","success":"1","targetip":"10.3.3.61"},{"interface":"0:0","mac":"00:50:56:80:79:ba","success":"1","targetip":"10.3.3.62"},{"mac":"00:50:56:a0:76:7f","interface":"0:0","success":"1","targetip":"10.3.3.124"},{"interface":"0:0","mac":"08:cc:68:0c:b6:c5","targetip":"10.3.3.1","success":"1"},{"targetip":"10.3.3.2","interface":"0:0","success":"0","mac":"incomplete"}],0)
    public parse_from_test(text : string) : boolean {
        this.raw_data = text;
        text = text.trim();
        this.parse(text);
        return true;
    }

    parse(tags_data : string) {
        let current_parm : string = "";
        let bracket_level : number = 0;
        let in_quote : boolean = false;
        let in_double_quote : boolean = false;
        let parenthesis_level : number = 0;
        let list_level : number = 0;

        tags_data = tags_data.replace(/^[^\(]+/g, '');
        tags_data = tags_data.replace(/^\(|\)$/g, '');
        let result : string[] = [];
        for (let  chr of tags_data)
        {
            switch (chr)
            {
                case '(':
                    parenthesis_level++;
                    current_parm += chr;
                    break;
                case ')':
                    parenthesis_level--;
                    current_parm += chr;
                    break;
                case '{':
                    bracket_level++;
                    current_parm += chr;
                    break;
                case '}':
                    bracket_level--;
                    current_parm += chr;
                    break;
                case '[':
                    list_level++;
                    current_parm += chr;
                    break;
                case ']':
                    list_level--;
                    current_parm += chr;
                    break;
                case '"':
                    in_double_quote = !in_double_quote;
                    current_parm += chr;
                    break;
                case '\'':
                    in_quote = !in_quote;
                    current_parm += chr;
                    break;
                default:
                    if (chr === ',' && !in_quote && !in_double_quote && (list_level + bracket_level) <= 0 && parenthesis_level < 1)
                    {
                        result.push(current_parm);
                        current_parm = "";
                    }
                    else
                    {
                        current_parm += chr;
                    }
                    break;
            }
        }
        result.push(current_parm);
        
        if (result.length !== 3) {
            return false;
        }

        if (this.parse_tags_from_test(result[0]))
        {
            this.value = result[1]; 
        }
        return this.name !== undefined;
    }

    parse_tags_from_test(tags_data : string) : boolean {
        tags_data = tags_data.replace(/^[^\(]+\(|\)$/g, '');
        let tags_regexp = /([^\s]+)\s+->\s+([^\s,]+)/g;
        let match;
        while (match = tags_regexp.exec(tags_data)) {
            if (match.length > 1) {
                let tag = new ResultMetricTag();
                tag.name = match[1];
                tag.value = match[2];
                this.tags.push(tag);

                if (tag.name === 'im.name') {
                    this.name = tag.value;
                }
            }
        }

        if (this.name === undefined) {
            return false;
        }

        return true;
    }

    public parse_from_parser(text : string) : boolean {
        this.raw_data = text;
        let regex_metric = /-- Metric Name:\s([^\s]+)\s\|{3}\s+Tags:\s+([^\|]+)\|{3}\sValue: (.+)/gs;
        let match = regex_metric.exec(text);
        if (match === null) {
            return false;
        }

        if (match.length !== 4) {
            return false;
        }

        let name  = match[1].trim();
        let tags = match[2].trim();
        let value = match[3].trim();
        this.name = name;
        this.value = value;

        let tag_assign_regex = /([^\s]+)\s=\s([^\s,]+)/g;

        let match_tags;
        while (match_tags = tag_assign_regex.exec(tags)) {
            let tag = new ResultMetricTag();
            tag.name = match_tags[1];
            tag.value = match_tags[2];
            this.tags.push(tag);
        }

        return this.name !== undefined;
    }

    public static parse_from_text(text : string) : ResultMetric[] {
        let result : ResultMetric[] = [];
        let metric_sections_match = /-- Metric Name:.+?(?=[0-9]{4}\-[0-9]{2}\-[0-9]{2}\s|$)/gs;
        let match;
        while (match = metric_sections_match.exec(text)) {
            let metric = new ResultMetric();
            if (metric.parse_from_parser(match[0])) {
                result.push(metric);
            }
        }

        return result;
    }
}

export class ResultMetricTag {
    public name : string | undefined = undefined;
    public value : string | undefined = undefined;
}