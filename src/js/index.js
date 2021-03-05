import '../css/app.css';
import {scan, token_types} from './scanner';
import {parse} from './parser';
import {add_vector_arrow, add_vector_arrow_to_svg, update_vector_arrow} from "./svg_functions";
import {
    addition,
    division,
    functions,
    label,
    logical_and,
    logical_or,
    multiplication,
    subtraction,
    test_equal
} from './functions.js';

const state = {};       // binding -> value
const bindings = {};    // binding -> {name:binding_name, evaluated: evaluated_lazy_value, previous: previous_value}
const references = {};  // for retrieval of objects by reference (@n, where n is a number)
const command_input_element = document.getElementById('command_input');
const command_history_element = document.getElementById('command_history');
command_input_element.value = '';
let command_history = [''];
let command_history_index = 0;

const keywords = {
    'true': true,
    'false': false,
    'pi': Math.PI,
    'PI': Math.PI
}

export const update_visible_objects = function () {
    Object.entries(bindings).forEach(entry => {                         // a lazy expression must be bound
        const [name, binding] = entry;
        let value = state[binding.name];
        if (value.lazy_expression) {
            let new_value = visit(value.lazy_expression);               // reevaluate,
            let existing_value = binding.evaluated;                     // update view
            if (new_value.is_vector || existing_value.is_vector) {
                bindings[name].evaluated = new_value;
                new_value.label_text = existing_value.label_text;       // SAD
                update_vector(existing_value, new_value, name);
            }
        }
    });


    Object.entries(references).forEach(entry => {
        const [id, value] = entry;
        if (value.lazy_expression) {
            let new_value = visit(value.lazy_expression);
            let existing_value = value;
            if (new_value.is_vector || existing_value.is_vector) {
                new_value.lazy_expression = value.lazy_expression;
                references[id] = new_value;
                if (existing_value && existing_value.id) {
                    // update view after reevaluation of lazy vectors
                    update_vector_arrow(existing_value.id, new_value);
                } else if (new_value.is_new && new_value.is_vector) {
                    // hidden lazy vector reappears
                    add_vector_arrow_to_svg(new_value);
                }
            }
        }
    });
}

const update_vector = function (existing_value, new_value, binding_name) {
    if (existing_value && existing_value.id) {
        // update view after reevaluation of lazy vectors
        update_vector_arrow(existing_value.id, new_value);
    } else if (new_value.is_new && new_value.is_vector) {
        // hidden lazy vector reappears
        new_value.label_text = binding_name;
        add_vector_arrow_to_svg(new_value);
    }
}

export const adjust_input_element_height = function () {
    let num_lines = command_input_element.value.split(/\n/).length;
    command_input_element.setAttribute('style', 'height: ' + num_lines + 'em');
    if (num_lines > 1) {
        command_input_element.setAttribute('class', 'multiline');
    } else {
        command_input_element.setAttribute('class', 'single_line');
    }
}

command_input_element.onkeypress = function handle_key_input(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
    }
}

command_input_element.onkeyup = function handle_key_input(event) {
    adjust_input_element_height();
    if (event.key === 'ArrowUp' && !event.shiftKey) {
        if (command_history_index > -1) {
            command_input_element.value = command_history[command_history_index];
            if (command_history_index > 0) {
                command_history_index -= 1;
            }
        }
    }
    if (event.key === 'ArrowDown' && !event.shiftKey) {
        if (command_history_index < command_history.length - 1) {
            command_history_index += 1;
            command_input_element.value = command_history[command_history_index];
        } else {
            command_input_element.value = '';
        }
    }
    if (event.key === 'Enter') {
        handle_enter();
    }
};

const handle_enter = function () {
    let commands = command_input_element.value;
    command_input_element.value = '';
    adjust_input_element_height();
    let command_array = commands.split(/\n/);
    for (let i = 0; i < command_array.length; i++) {
        let command = command_array[i];
        if (command.length > 0) {
            command_history_element.innerText += command + "\n";
            command_input_element.value = '';
            command_history_index = command_history.length;

            let value;
            try {
                let tokens = scan(command);
                let statement = parse(tokens);
                value = visit(statement);
                let binding;
                if (value.is_binding) {                         // if it's declaration work with the initializer
                    binding = value.name;                       // but we also need the name of the bound variable
                    value = state[binding];                     // lookup the value for the binding
                } else if (Object.prototype.hasOwnProperty.call(value, ['id'])) {
                    references['@' + value.id] = value;
                }
                while (value.lazy_expression) {
                    value = value.get();
                }
                if (binding) {
                    bindings[binding].evaluated = value;   // store evaluation result
                }

                if (value.is_visual) {
                    if (binding && bindings[binding].previous && bindings[binding].previous.is_visual) {
                        update_vector_arrow(bindings[binding].previous.id, value);
                    } else {
                        if (value.is_new) {
                            value.label_text = binding ? binding : "";
                            value.is_new = false;
                            add_vector_arrow(value);
                        }
                    }
                } else {
                    if (binding && bindings[binding].previous && bindings[binding].previous.is_visual) {
                        label(bindings[binding].previous, '@' + bindings[binding].previous.id);
                    }
                }
                update_visible_objects();
                if (value.description) {
                    value = value.description;
                }
            } catch (e) {
                value = e.message;
            }
            command_history_element.innerText += value.toString() + "\n";
            command_history.push(command);
            command_history_element.scrollTo(0, command_history_element.scrollHeight);
        }
    }
}

const visit = function (expr) {
    switch (expr.type) {
        case 'declaration': {
            let value = visit(expr.initializer);
            let binding_name = expr.var_name.value;
            if (bindings[binding_name]) {                                // do reassignment
                bindings[binding_name].previous = state[binding_name];   // remember previous value, to remove it from the visualisation
            } else {
                bindings[binding_name] = {
                    is_binding: true,
                    name: binding_name,
                    previous: null,
                    evaluated: null
                };
            }
            state[binding_name] = value;                                // assign new value to binding

            return bindings[binding_name];                              // don't return the value itself, but the binding_object
        }                                                               // with which you can lookup the value

        case 'group':                                                   // expression within parentheses
            return visit(expr.expression);
        case 'unary': {
            let right_operand = visit(expr.right);
            if (expr.operator === token_types.MINUS) {
                return -right_operand; //TODO create negate function (because now it only works for numbers)
            } else if (expr.operator === token_types.NOT) {
                return !right_operand;
            } else {
                throw {message: 'illegal unary operator'};
            }
        }
        case 'binary': {
            switch (expr.operator) {
                case token_types.MINUS:
                    return subtraction(visit(expr.left), visit(expr.right));
                case token_types.PLUS:
                    return addition(visit(expr.left), visit(expr.right));
                case token_types.STAR:
                    return multiplication(visit(expr.left), visit(expr.right));
                case token_types.SLASH:
                    return division(visit(expr.left), visit(expr.right));
                case token_types.DOT:
                    return method_call(visit(expr.left), expr.right); // right is not evaluated. It's the method name
                case token_types.EQUALS_EQUALS:
                    return test_equal(visit(expr.left), visit(expr.right));
                case token_types.AND:
                    return logical_and(visit(expr.left), visit(expr.right));
                case token_types.OR:
                    return logical_or(visit(expr.left), visit(expr.right));
            }
            throw {message: 'illegal binary operator'};
        }
        case 'identifier': {
            if (expr.name in keywords) {
                return keywords[expr.name];
            } else {
                if (state[expr.name]) {
                    let value = state[expr.name];
                    while (value.lazy_expression) {
                        value = value.get();
                    }
                    return value;
                } else {
                    return undefined;
                }
            }
        }
        case 'literal': {
            let value = expr.value;
            while (value.lazy_expression) {
                value = value.get();
            }
            return value;
        }
        case 'call':
            return function_call(expr.name, expr.arguments);
        case 'lazy': {
            let expression = expr.expression;
            let parsed_expression = expr.value;
            return {
                lazy_expression: parsed_expression,
                toString: function () {
                    return `"${expression}"`;
                },
                get: function () {
                    return visit(parsed_expression);
                }
            };
        }
        case 'reference': {
            return references[expr.name];
        }
    }
}

const function_call = function (function_name, argument_exprs) {
    if (Object.prototype.hasOwnProperty.apply(functions, [function_name])) {
        return functions[function_name](resolve_arguments(argument_exprs));
    } else {
        return `unknown function:  ${function_name}(${argument_exprs.map(e => e.value_type).join(',')})`;
    }
}

const method_call = function (object, method_or_property) {
    if (object) {
        if (method_or_property.type === 'call') { // method
            if (typeof object[method_or_property.name] !== 'function') {
                throw {message: `method '${method_or_property.name}' not found on ${object.type}`};
            }

            return object[method_or_property.name].apply(object, resolve_arguments(method_or_property.arguments));

        } else { // property
            if (!Object.prototype.hasOwnProperty.call(object, [method_or_property.name])) {
                throw {message: `property '${method_or_property.name}' not found on ${object.type}`};
            }
            return object[method_or_property.name];
        }
    } else {
        throw {message: `not found: ${object}`};
    }
}

const resolve_arguments = function (argument_exprs) {
    return argument_exprs.map(expr => {
        let value = visit(expr);
        while (value.lazy_expression) {
            value = value.get();
        }
        return value;
    });
}