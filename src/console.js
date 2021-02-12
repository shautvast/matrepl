/**
 * handles user input from the console div
 */
(function () {
        const state = {};
        const command_input_element = document.getElementById('command_input');
        const command_history_element = document.getElementById('command_history');
        const bottom = document.getElementById('bottom');
        command_input_element.value = '';
        let command_history = [];
        let command_history_index = 0;

        command_input_element.onkeyup = function handle_key_input(event) {
            if (event.key === 'ArrowUp') {
                if (command_history_index > -1) {
                    command_input_element.value = command_history[command_history_index];
                    if (command_history_index > 0) {
                        command_history_index -= 1;
                    }
                }
            }
            if (event.key === 'ArrowDown') {
                if (command_history_index < command_history.length - 1) {
                    command_history_index += 1;
                    command_input_element.value = command_history[command_history_index];
                } else {
                    command_input_element.value = '';
                }
            }
            if (event.key === 'Enter') {
                let command = command_input_element.value;
                command_history_element.innerText += command + "\n";
                command_input_element.value = '';
                command_history_index = command_history.length;
                let tokens = scan(command);
                let statement = parse(tokens);
                let result;
                try {
                    result = visit_expression(statement);
                    if (result.description) {
                        result = result.description;
                    }
                } catch (e) {
                    result = e.message;
                }
                command_history_element.innerText += result + "\n";
                command_history.push(command);
                command_history_element.scrollTo(0, command_history_element.scrollHeight);
            }
        };

        let visit_expression = function (expr) {
            switch (expr.type) {
                case 'declaration':
                    let value = visit_expression(expr.initializer);
                    let existing_value = state[expr.var_name.value];
                    if (existing_value) {
                        if (existing_value.type === 'vector') {
                            remove_vector(existing_value.object); // remove from screen
                        }
                    }
                    value.binding = expr.var_name.value;
                    state[expr.var_name.value] = value;
                    let description = state[expr.var_name.value].description;
                    if (!description) {
                        description = state[expr.var_name.value]; //questionable. use toString instead of message?
                    }
                    return {description: expr.var_name.value + ':' + description};
                case 'group':
                    return visit_expression(expr.expression);
                case 'unary':
                    let right_operand = visit_expression(expr.right);
                    if (expr.operator === token_types.MINUS) {
                        return -right_operand;
                    } else if (expr.operator === token_types.NOT) {
                        return !right_operand;
                    } else {
                        throw {message: 'illegal unary operator'};
                    }
                case 'binary':
                    let left = visit_expression(expr.left);
                    let right = visit_expression(expr.right);
                    switch (expr.operator) {
                        case token_types.MINUS:
                            return left - right;
                        case token_types.PLUS:
                            return addition(left, right);
                        case token_types.STAR:
                            return multiplication(left, right);
                        case token_types.SLASH:
                            return left / right;
                        case token_types.DOT:
                            return method_call(left, expr.right);
                    }
                    throw {message: 'illegal binary operator'}
                case 'identifier': {
                    if (state[expr.name]) {
                        return state[expr.name];
                    } else {
                        break;
                    }
                }
                case 'literal':
                    return expr.value;
                case 'call':
                    return call(expr.name, expr.arguments);
            }
        }

        const call = function (function_name, argument_exprs) {
            let arguments = [];
            for (let i = 0; i < argument_exprs.length; i++) {
                arguments.push(visit_expression(argument_exprs[i]));
            }
            if (functions[function_name]) {
                return functions[function_name](arguments);
            } else {
                let arg_list = '';
                for (let i = 0; i < argument_exprs.length; i++) {
                    if (i > 0) {
                        arg_list += ',';
                    }
                    arg_list += argument_exprs[i].value_type;
                }
                return 'unimplemented: ' + function_name + '(' + arg_list + ')';
            }
        }

        const method_call = function (object_wrapper, method_or_property) {
            if (object_wrapper) {
                if (method_or_property.type === 'call') { // method
                    if (typeof object_wrapper.object[method_or_property.name] !== 'function') {
                        throw {message: `method ${method_or_property.name} not found on ${object_wrapper.type}`};
                    }
                    return object_wrapper.object[method_or_property.name].apply(object_wrapper, method_or_property.arguments);

                } else { // property
                    if (!object_wrapper.object.hasOwnProperty(method_or_property.name)){
                        throw {message: `property ${method_or_property.name} not found on ${object_wrapper.type}`};
                    }
                    return object_wrapper.object[method_or_property.name];
                }
            } else {
                throw {message: `not found: ${object_wrapper}`};
            }
        }

        const functions = {
            help: () => help(),
            vector: (args) => add_vector({x0: args[0], y0: args[1], x: args[2], y: args[3]}),
            remove: (args) => {
                if (args[0].hasOwnProperty('binding')) {
                    delete this.state[args[0].binding];
                    return remove_vector(args[0].object); // by binding value
                } else {
                    return remove_vector(args[0]); // by index (@...)
                }

            },
        }

        const help = function () {
            return {message: 'vector(x0, y0, x, y): draws a vector from x0,y0 to x,y'}
        }

        const multiplication = function (left, right) {
            if (left.object && left.type === 'vector' && !right.object) {
                return left.object.multiply(right);
            }
            if (right.object && right.type === 'vector' && !left.object) {
                return right.object.multiply(left);
            }
            return left * right;
        }

        const addition = function (left, right) {
            if (left.object && left.type === 'vector' && right.object && right.type === 'vector') {
                return left.object.add(right.object);
            }
            return left + right;
        }
    }
)();