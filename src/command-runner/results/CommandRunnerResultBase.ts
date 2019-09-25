export class CommandRunnerResultBase {
    protected raw_data : string;
    protected raw_data_stripped : string;
    public constructor(raw_data : string) {
        this.raw_data = raw_data;

        this.raw_data_stripped = raw_data.replace(/\x1b\[[0-9;]*m/g, '');
    }
}