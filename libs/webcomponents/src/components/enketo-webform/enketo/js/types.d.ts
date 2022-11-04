export default types;
declare namespace types {
    namespace string {
        /**
         * @param {string} x - value
         * @return {string} converted value
         */
        function convert(x: string): string;
        /**
         * @param {string} x - value
         * @return {string} converted value
         */
        function convert(x: string): string;
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
    }
    namespace select {
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
    }
    namespace select1 {
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
    }
    namespace decimal {
        /**
         * @param {number|string} x - value
         * @return {number} converted value
         */
        function convert(x: string | number): number;
        /**
         * @param {number|string} x - value
         * @return {number} converted value
         */
        function convert(x: string | number): number;
        /**
         * @param {number|string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string | number): boolean;
        /**
         * @param {number|string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string | number): boolean;
    }
    namespace int {
        /**
         * @param {number|string} x - value
         * @return {number} converted value
         */
        function convert(x: string | number): number;
        /**
         * @param {number|string} x - value
         * @return {number} converted value
         */
        function convert(x: string | number): number;
        /**
         * @param {number|string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string | number): boolean;
        /**
         * @param {number|string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string | number): boolean;
    }
    namespace date {
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {number|string} x - value
         * @return {string} converted value
         */
        function convert(x: string | number): string;
        /**
         * @param {number|string} x - value
         * @return {string} converted value
         */
        function convert(x: string | number): string;
    }
    namespace datetime {
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {number|string} x - value
         * @return {string} converted value
         */
        function convert(x: string | number): string;
        /**
         * @param {number|string} x - value
         * @return {string} converted value
         */
        function convert(x: string | number): string;
    }
    namespace time {
        /**
         * @param {string} x - value
         * @param {boolean} [requireMillis] - whether milliseconds are required
         * @return {boolean} whether value is valid
         */
        function validate(x: string, requireMillis?: boolean | undefined): boolean;
        /**
         * @param {string} x - value
         * @param {boolean} [requireMillis] - whether milliseconds are required
         * @return {boolean} whether value is valid
         */
        function validate(x: string, requireMillis?: boolean | undefined): boolean;
        /**
         * @param {string} x - value
         * @param {boolean} [requireMillis] - whether milliseconds are required
         * @return {string} converted value
         */
        function convert(x: string, requireMillis?: boolean | undefined): string;
        /**
         * @param {string} x - value
         * @param {boolean} [requireMillis] - whether milliseconds are required
         * @return {string} converted value
         */
        function convert(x: string, requireMillis?: boolean | undefined): string;
        /**
         * converts "11:30 AM", and "11:30 ", and "11:30 上午" to: "11:30"
         * converts "11:30 PM", and "11:30 下午" to: "23:30"
         *
         * @param {string} x - value
         * @return {string} converted value
         */
        function convertMeridian(x: string): string;
        /**
         * converts "11:30 AM", and "11:30 ", and "11:30 上午" to: "11:30"
         * converts "11:30 PM", and "11:30 下午" to: "23:30"
         *
         * @param {string} x - value
         * @return {string} converted value
         */
        function convertMeridian(x: string): string;
    }
    namespace barcode {
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
    }
    namespace geopoint {
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {string} x - value
         * @return {string} converted value
         */
        function convert(x: string): string;
        /**
         * @param {string} x - value
         * @return {string} converted value
         */
        function convert(x: string): string;
    }
    namespace geotrace {
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {string} x - value
         * @return {string} converted value
         */
        function convert(x: string): string;
        /**
         * @param {string} x - value
         * @return {string} converted value
         */
        function convert(x: string): string;
    }
    namespace geoshape {
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {string} x - value
         * @return {boolean} whether value is valid
         */
        function validate(x: string): boolean;
        /**
         * @param {string} x - value
         * @return {string} converted value
         */
        function convert(x: string): string;
        /**
         * @param {string} x - value
         * @return {string} converted value
         */
        function convert(x: string): string;
    }
    namespace binary {
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
        /**
         * @return {boolean} always `true`
         */
        function validate(): boolean;
    }
}
