/**
 * Creates an array of tokens from a line of input.
 *
 * @param command: string
 * @returns {token_types[]}
 */
export const scan = function (command) {
    let current_index = 0, // current index of char to look at in the command string
        word_start_index = 0, // marker for start of a literal or identifier
        tokens = [];

    while (!is_at_end()) {
        word_start_index = current_index;
        let token = scan_token();
        if (token) { // undefined mostly means whitespace
            tokens.push(token);
        }
    }
    return tokens;

    function scan_token() {
        let next_char = advance();
        switch (next_char) {
            case '(':
                return token_types.LEFT_PAREN;
            case ')':
                return token_types.RIGHT_PAREN;
            case '[':
                return token_types.LEFT_BRACKET;
            case ']':
                return token_types.RIGHT_BRACKET;
            case ',':
                return token_types.COMMA;
            case '.':
                return token_types.DOT;
            case '-':
                return token_types.MINUS;
            case '+':
                return token_types.PLUS;
            case '*':
                return token_types.STAR;
            case '/':
                return token_types.SLASH;
            case '>':
                if (expect('=')) {
                    return token_types.GREATER_OR_EQUAL;
                } else {
                    return token_types.GREATER;
                }
            case '<':
                if (expect('=')) {
                    return token_types.LESS_OR_EQUAL;
                } else {
                    return token_types.LESS;
                }
            case '!':
                if (expect('=')) {
                    return token_types.NOT_EQUALS;
                } else {
                    return token_types.NOT;
                }
            case '=':
                if (expect('=')) {
                    return token_types.EQUALS_EQUALS;
                } else {
                    return token_types.EQUALS;
                }
            case '\'':
                return string();
            case '"':
                return lazy_expression();
        }
        if (is_digit(next_char)) {
            let token = Object.assign({}, token_types.NUMERIC);
            token.value = parse_number();
            return token;
        } else {
            if (is_alpha_or_underscore(next_char)) {
                let token = Object.assign({}, token_types.IDENTIFIER);
                token.value = parse_identifier();
                return token;
            }
        }
    }

    function expect(expected_char) {
        if (is_at_end()) {
            return false;
        }
        if (current_char() === expected_char) {
            advance();
            return true;
        } else {
            return false;
        }
    }

    function advance() {
        if (current_index < command.length) {
            current_index += 1;
        }
        return command[current_index - 1];
    }

    function is_at_end() {
        return current_index >= command.length;
    }

    function current_char() {
        return command[current_index];
    }

    function is_digit(char) {
        return char >= '0' && char <= '9';
    }

    function is_part_of_number(char) {
        return is_digit(char) || char === '.'; // no scientific notation for now
    }

    function parse_number() {
        while (is_part_of_number(current_char())) {
            advance();
        }
        let number_string = command.substring(word_start_index, current_index);
        return Number.parseFloat(number_string);
    }

    function is_alpha_or_underscore(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
    }

    function is_alphanumeric_or_underscore(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || is_digit(char) || char === '_';
    }

    function parse_identifier() {
        while (is_alphanumeric_or_underscore(current_char())) {
            advance();
        }
        return command.substring(word_start_index, current_index);
    }

    function string() { // as of yet strings may not unclude escaped quotes that are also the start/end quote
        while (current_char() !== '\'' && !is_at_end()) {
            advance();
        }
        if (is_at_end() && current_char() !== '\'') {
            throw {message: 'unterminated string'}
        } else {
            let string_token = Object.assign({}, token_types.STRING);
            string_token.value = command.substring(word_start_index + 1, current_index);
            advance();
            return string_token;
        }
    }

    function lazy_expression() {
        while (current_char() !== '"' && !is_at_end()) {
            advance();
        }
        if (is_at_end() && current_char() !== '"') {
            throw {message: 'unterminated string'}
        } else {
            let lazy_token = Object.assign({}, token_types.LAZY);
            lazy_token.expression = command.substring(word_start_index + 1, current_index);
            advance();
            return lazy_token;
        }
    }
};

export const token_types = {
    LEFT_PAREN: {type: 'left_paren'},
    RIGHT_PAREN: {type: 'right_paren'},
    LEFT_BRACKET: {type: 'left_bracket'},
    RIGHT_BRACKET: {type: 'right_bracket'},
    COMMA: {type: 'comma'},
    DOT: {type: 'dot'},
    MINUS: {type: 'minus'},
    PLUS: {type: 'plus'},
    STAR: {type: 'star'},
    SLASH: {type: 'slash'},
    EQUALS: {type: 'equals'},
    EQUALS_EQUALS: {type: 'equals_equals'},
    NOT_EQUALS: {type: 'not_equals'},
    NOT: {type: 'not'},
    GREATER: {type: 'greater'},
    GREATER_OR_EQUAL: {type: 'greater_or_equal'},
    LESS: {type: 'less'},
    LESS_OR_EQUAL: {type: 'less_or_equal'},
    NUMERIC: {type: 'number', value: undefined},
    IDENTIFIER: {type: 'identifier', value: undefined},
    STRING: {type: 'string', value: undefined},
    LAZY: {type: 'lazy', expression: undefined, parsed_expression:undefined}
};
