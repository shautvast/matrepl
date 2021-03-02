import {scan, token_types} from './scanner';
import {parse} from './parser';
import {
    add_vector_arrow,
    add_vector_arrow_to_svg,
    remove_vector_arrow,
    update_label_text,
    update_vector_arrow
} from "./svg_functions";

const state = {};       // binding -> value
const bindings = {};    // binding -> {name:binding_name, evaluated: evaluated_lazy_value, previous: previous_value}
const references = {};  // for retrieval of objects by reference (@n, where n is a number)
const command_input_element = document.getElementById('command_input');
const command_history_element = document.getElementById('command_history');
command_input_element.value = '';
let command_history = [''];
let command_history_index = 0;
let index_sequence = 0;

const hide = function (vector) {
    remove_vector_arrow(vector);
    return {description: `vector@${vector.id} is hidden`};
}

const label = function (vector, text) {
    vector.label_text = text;
    update_label_text(vector.id, text);
    return `label set to ${text} on vector@${vector.id}`;
}

const show = function (vector) {
    add_vector_arrow_to_svg(vector);
    return {description: `vector@${vector.id} is visible`};
}

export const update_lazy_objects = function () {
    Object.values(bindings).forEach(binding => {
        if (state[binding.name].lazy_expression) {
            let value = visit(state[binding.name].lazy_expression);
            let existing_value = bindings[binding.name].evaluated;
            if (existing_value) {
                update_vector_arrow(existing_value.id, value);
                bindings[binding.name].evaluated = value;
            }
        }
    });
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
            let tokens = scan(command);
            let statement = parse(tokens);
            let value;
            try {
                value = visit(statement);
                let binding;
                if (value.is_binding) {                     // if it's declaration work with the initializer
                    binding = value.name;                   // but we also need the name of the bound variable
                    value = state[binding];
                }
                while (value.lazy_expression) {
                    value = value.get();
                }
                if (binding) {
                    bindings[binding].evaluated = value;   // store evaluation result
                }

                if (value.is_visual) {
                    if (value.is_vector) {
                        if (binding && bindings[binding].previous && bindings[binding].previous.is_visual) {
                            update_vector_arrow(bindings[binding].previous.id, value);
                        } else {
                            if (value.is_new) {
                                value.label_text = binding ? binding : "";
                                value.is_new = false;
                                add_vector_arrow(value);
                            }
                        }
                    }
                }
                update_lazy_objects();
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
            if (bindings[binding_name]) {                            // do reassignment
                bindings[binding_name].previous = state[binding_name];    // remember previous value, to remove it from the visualisation
            } else {
                bindings[binding_name] = {
                    is_binding: true,
                    name: binding_name,
                    previous: null,
                    evaluated: null
                };
            }
            state[binding_name] = value;                             // assign new value to binding

            return bindings[binding_name];
        }
        case 'group':                                   // expression within parentheses
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
                    return subtract(visit(expr.left), visit(expr.right));
                case token_types.PLUS:
                    return addition(visit(expr.left), visit(expr.right));
                case token_types.STAR:
                    return multiplication(visit(expr.left), visit(expr.right));
                case token_types.SLASH:
                    return visit(expr.left) / visit(expr.right);
                case token_types.DOT:
                    return method_call(visit(expr.left), expr.right); // right is not evaluated. It's the method name
                // could also be evaluated to itself, BUT it's of type call which would invoke a function (see below)
            }
            throw {message: 'illegal binary operator'};
        }
        case 'identifier': {
            if (state[expr.name]) {
                let value = state[expr.name];
                while (value.lazy_expression) {
                    value = value.get();
                }
                return value;
            } else {
                break;
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

const functions = {
    help: () => help(),
    vector: (args) => {
        if (args.length === 2) {
            return create_vector({x0: 0, y0: 0, x: args[0], y: args[1]});
        } else {
            return create_vector({x0: args[0], y0: args[1], x: args[2], y: args[3]});
        }
    },
    hide: (args) => {
        return hide(args[0]);
    },
    label: (args) =>{
        return label(args[0], args[1]);
    },
    show: (args) =>{
        return show(args[0]);
    }
}

const help = function () {
    return {
        description:
            `- vector(<x0>, <y0>, <x>, <y>): draws a vector from x0,y0 to x,y
                     - remove(<identifier>|<ref>): removes an object, 
                        a ref is @n where n is the reference number asigned to the object`
    }
}

const multiplication = function (left, right) {

    const multiply = function (vector, scalar) {
        return create_vector({
            x0: vector.x0 * scalar,
            y0: vector.y0 * scalar,
            x: vector.x * scalar,
            y: vector.y * scalar
        });
    };

    if (left && left.is_vector && !right.is_vector) {
        return multiply(left, right);
    }
    if (right && right.is_vector && !left.is_vector) {
        return multiply(right, left);
    }
    return left * right;
}

const addition = function (left, right) {
    if (left && left.is_vector && right && right.is_vector) {
        return create_vector({
            x0: left.x0 + right.x0,
            y0: left.x0 + right.x0,
            x: left.x + right.x,
            y: left.y + right.y
        });
    }
    return left + right;
}

const subtract = function (left, right) {
    if (left && left.is_vector && right && right.is_vector) {
        return create_vector({
            x0: left.x0 - right.x0,
            y0: left.x0 - right.x0,
            x: left.x - right.x,
            y: left.y - right.y
        });
    }
    return left - right;
}

export const create_vector = function (vector) { //rename to create_vector
    vector.id = index_sequence++;
    vector.is_visual = true;
    vector.is_vector = true; // for comparison
    vector.type = 'vector'; // for showing type to user
    vector.is_new = true;
    vector.toString = function () {
        return `vector@${this.id}{x0:${vector.x0},y0:${vector.y0} x:${vector.x},y:${vector.y}}`;
    };
    references["@" + vector.id] = vector;
    vector.hide = function () {
        return hide(this);
    };
    vector.label = function (text) {
        return label(this, text);
    };
    vector.show = function () {
        return show(this);
    };
    return vector;
}

const resolve_arguments = function(argument_exprs) {
    let arguments_list = [];
    for (let i = 0; i < argument_exprs.length; i++) {
        arguments_list.push(visit(argument_exprs[i]));
    }
    return arguments_list;
}