"use strict";
class KeyValuePair {
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
    static TryParse(text) {
        if (!this.CanParse(text)) {
            return null;
        }
        let key_value = text.split('@--@', 2);
        if (key_value.length !== 2) {
            return null;
        }
        return new KeyValuePair(key_value[0], key_value[1]);
    }
    static CanParse(text) {
        return text.indexOf('@--@') > -1;
    }
}
//# sourceMappingURL=KeyValuePair.js.map