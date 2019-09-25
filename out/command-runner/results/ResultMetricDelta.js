"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResultMetricDelta {
    constructor() {
        this.tags = [];
    }
    static get(metric1, metric2) {
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
            }
            else {
                let new_tag = new ResultMetricTagDelta();
                new_tag.name2 = tag2.name;
                new_tag.value2 = tag2.value;
                delta.tags.push(new_tag);
            }
        }
        delta.tags = delta.tags.filter((value) => {
            return value.is_diff();
        });
        return delta;
    }
    static find_tag(name, tags) {
        for (let tag of tags) {
            if (tag.name === name) {
                return tag;
            }
        }
        return undefined;
    }
}
exports.ResultMetricDelta = ResultMetricDelta;
class ResultMetricTagDelta {
    is_diff() {
        return (this.name !== this.name2) || (this.value !== this.value2);
    }
}
exports.ResultMetricTagDelta = ResultMetricTagDelta;
//# sourceMappingURL=ResultMetricDelta.js.map