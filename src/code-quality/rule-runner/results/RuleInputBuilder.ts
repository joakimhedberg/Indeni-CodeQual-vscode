import * as fs from 'fs';

export class RuleInputBuilder {
    public async from_time_series_output(filename : string) : Promise<string | undefined> {
        return new Promise<string | undefined>((resolve, reject) => {
            let data = fs.readFileSync(filename, { encoding: 'utf-8'} );

            try {
                let json = JSON.parse(data);

                if (json['type'] !== 'monitoring') {
                    reject('This only works with monitoring output');
                    return;
                }

                let output_data : string[] = [];
                output_data.push('devices:');
                output_data.push(this.get_indent(1) + 'device-a:');
                output_data.push(this.get_indent(2) + 'metrics:');
                for (let res of json['result']) {
                    this.push_metric(output_data, res);                   
                }
        
                resolve(output_data.join('\n'));

            } catch (error) {
                reject(error);
                return;
            }
        });

        
    }

    private push_metric(arr : string[], res : any) {
        if (res['type'] === 'ts') {
            this.push_timeseries_metric(arr, res);
        }
        else if (res['type'] === 'snapshot') {
            this.push_snapshot_metric(arr, res);
        }
    }

    private push_snapshot_metric(arr : string[], res : any) {
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

    private push_timeseries_metric(arr : string[], res : any) {
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

    private get_indent(indent : number) : string {
        let result : string = '';
        indent = indent * 4;
        for (let i = 0; i < indent; i++) {
            result += ' ';
        }
        return result;
    }
}

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