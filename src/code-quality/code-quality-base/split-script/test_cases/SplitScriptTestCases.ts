import { SplitScriptTestCase } from "./SplitScriptTestCase";
import * as fs from 'fs';
import * as path from 'path';

export class SplitScriptTestCases {
    public static get(test_file_json : string) : SplitScriptTestCase[] {
        let result : SplitScriptTestCase[] = [];

        let json_text : string = fs.readFileSync(test_file_json, { encoding: 'UTF-8' });
        let obj = JSON.parse(json_text);
        for (let key in obj['nameToCase']) {
            let test_case = new SplitScriptTestCase();
            test_case.name = key;
            //console.log(key);
            test_case.input_path = path.join(path.dirname(test_file_json), obj['nameToCase'][key]['inputPath']);
            //console.log('\t1: ' + test_case.input_path);
            test_case.output_path = path.join(path.dirname(test_file_json), obj['nameToCase'][key]['outputPath']);
            //console.log('\t2: ' + test_case.output_path);
            test_case.input_data_path = this.get_data_path(test_case.input_path);
            //console.log('\t3: ' + test_case.input_data_path);
            result.push(test_case);
        }

        
        return result;
    }

    private static get_data_path(input_json_file : string) {

        let json_text : string = '';
        try
        {
            json_text = fs.readFileSync(input_json_file, { encoding: 'UTF-8' });

        } catch {
            return "";
        }
        let value_match = /\"path\"\s?:\s?\"([^\"]+)/g;

        //console.log('JSON START');
        //console.log(json_text);
        //console.log('JSON END');

        let match = value_match.exec(json_text);
        //console.log('\t\tMatch');
        //console.log(match);
        if (match !== null) {
            return path.join(path.dirname(input_json_file), match[1]);
        }

        return "";
    }
}