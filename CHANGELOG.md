# Change Log

## [Upcoming release]
Various bugfixes reported @ github

## [0.3.3]
Moved CommandRunner over to an async class
Split create/recreate test cases into two separate commands
New command: Indeni: Create new rule
    Creates a new rule with all available parameters
New command: Indeni: Create python parser class
    Creates a new python parser based on the indeni template

## [0.3.2]
Changed github repository path

## [0.3.1]
Support for python parser
Support for --inject-tags in command-runner. Only tested on Windows so far

## [0.3.0]
New github page

## [0.2.9]
Added the option to run command-runner verbose. * Experimental

## [0.2.8]
Fixed a bug where the command-runner failed to run

## [0.2.7]
Fixed a broken dependency

## [0.2.6]
Additional bug fixes in the rule runner support

## [0.2.5]
Bug fix, rule runner support

## [0.2.4]
Added new logic for write*Metric snippets
Added tooltips for write*Metric snippets
Added support for command-runner integration
Added support for rule-runner integration
Various bugfixes/improvements
New shortcut CTRL+I S toggles script/test folder for easier access

## [0.2.1]
Finishing touches on the split scripts
New web view, it no longer shows null at the top

## [0.2.0]
Added support for the new script map structure

## [0.1.6]
Added ignore functionality to comments
Added gigamon to the allowed script prefixes

## [0.1.5]
Minor fix, re-added the check for .ind scripts.

## [0.1.4]
Some bugfixes. Some tidying up in the code-behind.
New quality check, script name

## [0.1.3]
Fixed the yaml indent check. It had problems with CRLF
Fixed the embedded-awk iterator and made it a little more robust.
Added write*Metric snippets
Made the credits a bit less invasive...
Added buttons in the gui to navigate/scroll to the issue
New function: Mark erroneous section definitions(Verify section marker syntax)

## [0.1.2]
Fixed the variable naming convention. Or atleast improved it.
It will check for variables, matching them with the snake_case convention. Alerts if the match fails.
Also supports embedded awk in yaml sections.

## [0.1.1]
- Giving credits where credits are due
- Readme file cleanup
- More work on the function view. Open it by using "Perform code quality". Click an alert item to see the offending lines.
- Disabled the CRLF check. CRLF is allowed as well as LF.
- Fixed an issue in the yaml whitespace check where CRLF created a false positive.

## [0.1.0]
- Fixed issue #43.
- Added feature overview of quality functions

## [0.0.1]
- Initial release of Indeni code quality checker plugin

