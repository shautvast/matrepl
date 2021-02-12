const parse = function (tokens) {
    let token_index = 0;

    return statement();

    function statement() {
        if (check(token_types.IDENTIFIER, token_index) && check(token_types.EQUALS, token_index + 1)) {
            let var_name = current_token();
            advance();
            advance();
            return {type: 'declaration', var_name: var_name, initializer: expression()};
        } else {
            return expression();
        }
    }

    function expression() {
        return equality();
    }

    function equality() {
        let expr = comparison()

        while (match([token_types.EQUALS_EQUALS, token_types.NOT_EQUALS])) {
            let operator = previous_token();
            let right = unary();
            expr = {type: 'binary', left: expr, operator: operator, right: right};
        }

        return expr;
    }

    function comparison() {
        let expr = addition();

        while (match([token_types.LESS, token_types.LESS_OR_EQUAL, token_types.GREATER, token_types.GREATER_OR_EQUAL])) {
            let operator = previous_token();
            let right = addition();
            expr = {type: 'binary', left: expr, operator: operator, right: right};
        }

        return expr;
    }

    function addition() {
        let expr = multiplication();

        while (match([token_types.MINUS, token_types.PLUS])) {
            let operator = previous_token();
            let right = multiplication();
            expr = {type: 'binary', left: expr, operator: operator, right: right};
        }

        return expr;
    }

    function multiplication() {
        let expr = unary();

        while (match([token_types.SLASH, token_types.STAR, token_types.DOT])) {
            let operator = previous_token();
            let right = unary();
            expr = {type: 'binary', left: expr, operator: operator, right: right};
        }

        return expr;
    }

    function unary() {
        if (match([token_types.NOT, token_types.MINUS])) {
            let operator = previous_token();
            let right = unary();
            return {type: 'unary', operator: operator, right: right};
        } else {
            return call();
        }
    }

    function call() {
        let expr = primary();

        while (true) {
            if (match([token_types.LEFT_PAREN])) {
                expr = finish_call(expr.name);
            } else {
                break;
            }
        }

        return expr;
    }

    function finish_call(callee) {
        let arguments = [];
        if (!check(token_types.RIGHT_PAREN, token_index)) {
            do {
                arguments.push(expression());
            } while (match([token_types.COMMA]));
        }
        if (!match([token_types.RIGHT_PAREN])) {
            throw {message: "Expect ')' after arguments."};
        }

        return {type: 'call', name: callee, arguments: arguments};
    }


    function primary() {
        if (match([token_types.NUMERIC, token_types.STRING])) {
            return {type: 'literal', value: previous_token().value, value_type: previous_token().type};
        } else if (match([token_types.LEFT_PAREN])) {
            let expr = expression();
            if (expr && match([token_types.RIGHT_PAREN])) {
                return {type: 'group', expression: expr};
            } else {
                throw {message: 'expected expression or )'};
            }
        } else if (check(token_types.IDENTIFIER, token_index)) {
            let identifier = {type: 'identifier', name: current_token().value};
            advance();
            return identifier;
        }
    }

    /**
     * matches token against array of tokens to check for equality (matching type)
     * @param tokens_to_match array of tokens
     * @returns {boolean}
     */
    function match(tokens_to_match) {
        for (let i = 0; i < tokens_to_match.length; i++) {
            if (are_same(tokens_to_match[i], current_token())) {
                advance()
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if token at position index matches the given
     * @param token_to_check expected token type
     * @param index of token to check
     * @returns {boolean}
     */
    function check(token_to_check, index) {
        let token = tokens[index];
        if (!token) {
            return false;
        }
        return are_same(token_to_check, token);

    }

    /**
     * checks if 2 tokens have same type
     * @param token_1
     * @param token_2
     * @returns {boolean}
     */
    function are_same(token_1, token_2) {
        if (is_at_end()) {
            return false;
        } else {
            return token_1.type === token_2.type;
        }

    }

    function is_at_end() {
        return token_index >= tokens.length;
    }

    function advance() {
        token_index += 1;
    }

    function previous_token() {
        return tokens[token_index - 1];
    }

    function current_token() {
        return tokens[token_index];
    }
}