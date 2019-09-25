import { ResultMetric } from "./ResultMetric";
import { ResultMetricDelta } from "./ResultMetricDelta";

export class CommandRunnerTestCase {
    public name : string;
    public success : boolean = false;
    public expected_metrics : ResultMetric[] = [];
    public got_metrics : ResultMetric[] = [];

    public expected_raw : string | undefined = undefined;
    public got_raw : string | undefined = undefined;

    public added_metrics : ResultMetric[] = [];
    public removed_metrics : ResultMetric[] = [];
    public metric_delta : ResultMetricDelta[] = [];

    public constructor(name : string, raw_data : string)    {
        this.name = name;
        this.parse_info(raw_data);
    }

    parse_info(data : string) {
        let success_regex = new RegExp("'" + this.name +"' has been completed successfully", 'g');
        if (data.match(success_regex) !== null) {
            this.success = true;
            return;
        }

        let fail_regex = new RegExp(this.name + "' failed.+?(?=[0-9]{4}\-[0-9]{2}\-[0-9]{2}\s|$)", 'gs');
        let match = fail_regex.exec(data);
        if (match !== null) {
            this.parse_fail_data(match[0]);
        }
    }

    parse_fail_data(data : string) {
        let expected_regex = /Expected:\s?(.+?)(?=But got)/gs;
        let got_regex = /But got:(.+?)(?=[0-9]{4}\-[0-9]{2}\-[0-9]{2}\s|$)/gs;

        let match_expected = expected_regex.exec(data);
        let got_expected = got_regex.exec(data);
        if (match_expected !== null && got_expected !== null) {
            let expected = match_expected[1];
            //this.expected_raw = expected;
            this.parse_metrics(this.expected_metrics, expected);
            let but_got = got_expected[1];
            //this.got_raw = but_got;
            this.parse_metrics(this.got_metrics, but_got);

        }
    }

    parse_metrics(metric_arr : ResultMetric[], data : string) {
        let line_data = data.trim().split('\n');

        for (let metric_data of line_data) {
            let metric = new ResultMetric();
            if (metric.parse_from_test(metric_data)) {
                metric_arr.push(metric);
            }
            else {
                console.warn('Unable to parse metric from data: ' + data);
            }
        }

        let delta = this.get_metric_delta();
        this.added_metrics = delta[0];
        this.removed_metrics = delta[1];
        this.metric_delta = delta[2];
    }

    public get_metric_delta() : [ResultMetric[], ResultMetric[], ResultMetricDelta[]] {
        let expected_metrics : ResultMetric[] = [];
        let got_metrics : ResultMetric[] = [];
        let delta_metrics : ResultMetricDelta[] = [];

        this.expected_metrics.forEach(o => expected_metrics.push(o));
        this.got_metrics.forEach(o => got_metrics.push(o));

        for (let i = 0; i < expected_metrics.length; i++) {
            let expected = expected_metrics[i];
            if (this.find_match(expected, got_metrics) !== undefined) {
                expected_metrics.splice(i);
                i--;
            }
        }

        for (let i = 0; i < expected_metrics.length; i++) {
            let expected = expected_metrics[i];
            let match = this.find_closest_match(expected, got_metrics);
            if (match !== undefined) {
                delta_metrics.push(ResultMetricDelta.get(expected, match));
                expected_metrics.splice(i);
                i--;
            }
        }
        
        return [got_metrics, expected_metrics, delta_metrics];
    }
    
    find_closest_match(metric : ResultMetric, metrics_array : ResultMetric[]) : ResultMetric | undefined {
        let match_index = -1;
        let current_match_point = -1;
        for (let i = 0; i < metrics_array.length; i++) {
            let compare = metrics_array[i];
            let points = metric.compare_points(compare);
            if (points > current_match_point) {
                match_index = i;
                current_match_point = points;
            }
        }

        let result : ResultMetric | undefined = undefined;
        if (match_index > -1) {
            result = metrics_array[match_index];
            metrics_array.splice(match_index);
        }

        return result;
    }

    find_match(metric : ResultMetric, metrics_array : ResultMetric[]) : ResultMetric | undefined {
        for (let i = 0; i < metrics_array.length; i++) {
            let item = metrics_array[i];
            if (item.matches(metric)) {
                metrics_array.splice(i);
                return item;
            }
        }
        return undefined;
    }
}