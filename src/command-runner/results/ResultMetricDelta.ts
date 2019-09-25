import { ResultMetric } from "./ResultMetric";

export class ResultMetricDelta {
    public name1 : string | undefined;
    public name2 : string | undefined;
    public value1 : any;
    public value2 : any;
    public tags : ResultMetricTagDelta[] = [];

    public static get(metric1 : ResultMetric, metric2 : ResultMetric) : ResultMetricDelta {
        let delta = new ResultMetricDelta();

        delta.name1 = metric1.name;
        delta.name2 = metric2.name;
        delta.value1 = metric1.value;
        delta.value2 = metric2.value;

        for (let tag of metric1.tags) {
            let delta_tag = new ResultMetricTagDelta();
            delta_tag.name = tag.name;
            delta_tag.value = tag.value;
            delta.tags.push(delta_tag);
        }



        for (let tag2 of metric2.tags) {
            let tag = this.find_tag(tag2.name, delta.tags);
            if (tag !== undefined) {
                tag.name2 = tag2.name;
                tag.value2 = tag2.value;
            } else {
                let new_tag = new ResultMetricTagDelta();
                new_tag.name2 = tag2.name;
                new_tag.value2 = tag2.value;
                delta.tags.push(new_tag);
            }
        }

        delta.tags = delta.tags.filter((value : ResultMetricTagDelta) => {
            return value.is_diff();
        });

        return delta;
    }

    private static find_tag(name : string | undefined, tags : ResultMetricTagDelta[]) : ResultMetricTagDelta | undefined {
        for (let tag of tags) {
            if (tag.name === name) {
                return tag;
            }
        }
        return undefined;
    }
}

export class ResultMetricTagDelta {
    public name : string | undefined;
    public name2 : string | undefined;

    public value : string | undefined;
    public value2 : string | undefined;

    public is_diff() : boolean {
        return (this.name !== this.name2) || (this.value !== this.value2);
    }
}