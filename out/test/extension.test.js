"use strict";
//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'assert' provides assertion methods from node
const assert = require("assert");
const path = require("path");
const fs = require("fs");
const sections_1 = require("../code-quality/sections");
const code_validation_1 = require("../code-quality/code-validation");
const MarkerResult_1 = require("../code-quality/code-quality-base/MarkerResult");
const SplitScript_1 = require("../code-quality/code-quality-base/split-script/SplitScript");
const SplitScriptValidationCollection_1 = require("../code-quality/code-quality-base/split-script/validations/SplitScriptValidationCollection");
const CodeValidation_1 = require("../code-quality/code-quality-base/CodeValidation");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';
const base_path = path.join(__dirname, '../../resources/testing');
// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function () {
    /*
        Simple unit tests to compare before and after
        If a unit test fails you should look into why and fix accordingly
        If you are right and the test is wrong, correct the test

        All test scripts should be placed in resources/testing.
        To access a test script, join the filename with the base_path variable
    */
    test("Test 1", function () {
        // Create an instance of the quality functions
        const quality_functions = new code_validation_1.CodeValidations();
        // Get the filename to your test data
        let script_data_path = path.join(base_path, "var_name_90_comma_4_undoc_2_space_before_2.ind");
        // Read the data as a string from the file
        let data = fs.readFileSync(script_data_path, 'utf-8');
        // Create a sections object with the script data
        let sections = sections_1.get_sections(data);
        // Apply the quality check on the sections
        quality_functions.apply(sections);
        // Create new collections for the markers. Since we do not need to mark then we can leave the decoration type as undefined
        let error_collection = new MarkerResult_1.MarkerCollection(undefined);
        let warning_collection = new MarkerResult_1.MarkerCollection(undefined);
        let information_collection = new MarkerResult_1.MarkerCollection(undefined);
        // Add the markers to the collections, seems redundant but the MarkerCollection filters out duplicates
        for (let warning of quality_functions.warning_markers) {
            warning_collection.append(warning);
        }
        for (let error of quality_functions.error_markers) {
            error_collection.append(error);
        }
        for (let info of quality_functions.information_markers) {
            information_collection.append(info);
        }
        // In the test script, we got 6 errors and 94 warnings, check if this is still the case
        assert.equal(error_collection.markers.size, 6);
        assert.equal(warning_collection.markers.size, 94);
    });
});
suite('Split script tests', function () {
    test("Split script test 1 - Awk", function () {
        const script = new SplitScript_1.SplitScript();
        if (script.load(path.join(base_path, "split_test_cases", "awk example", "console-idle-time.parser.1.awk"), undefined)) {
            let validations = new SplitScriptValidationCollection_1.SplitScriptValidationCollection();
            let markers = validations.apply(script);
            // Create new collections for the markers. Since we do not need to mark then we can leave the decoration type as undefined
            let error_collection = new MarkerResult_1.MarkerCollection(undefined, CodeValidation_1.FunctionSeverity.error);
            let warning_collection = new MarkerResult_1.MarkerCollection(undefined, CodeValidation_1.FunctionSeverity.warning);
            let information_collection = new MarkerResult_1.MarkerCollection(undefined, CodeValidation_1.FunctionSeverity.information);
            for (let marker of markers) {
                error_collection.append(marker);
                warning_collection.append(marker);
                information_collection.append(marker);
            }
            assert.equal(error_collection.markers.size, 25);
            assert.equal(warning_collection.markers.size, 10);
            assert.equal(information_collection.markers.size, 0);
        }
    });
    test("Split script test 2 - Ind", function () {
        const script = new SplitScript_1.SplitScript();
        if (script.load(path.join(base_path, "split_test_cases", "awk example", "console-idle-time.ind.yaml"), undefined)) {
            let validations = new SplitScriptValidationCollection_1.SplitScriptValidationCollection();
            let markers = validations.apply(script);
            // Create new collections for the markers. Since we do not need to mark then we can leave the decoration type as undefined
            let error_collection = new MarkerResult_1.MarkerCollection(undefined, CodeValidation_1.FunctionSeverity.error);
            let warning_collection = new MarkerResult_1.MarkerCollection(undefined, CodeValidation_1.FunctionSeverity.warning);
            let information_collection = new MarkerResult_1.MarkerCollection(undefined, CodeValidation_1.FunctionSeverity.information);
            for (let marker of markers) {
                error_collection.append(marker);
                warning_collection.append(marker);
                information_collection.append(marker);
            }
            assert.equal(error_collection.markers.size, 4);
            assert.equal(warning_collection.markers.size, 0);
            assert.equal(information_collection.markers.size, 0);
        }
    });
});
//# sourceMappingURL=extension.test.js.map