import {add_vector_arrow_to_svg, remove_vector_arrow, update_label_text} from "./svg_functions";

let index_sequence = 0;

export const functions = {
    help: () => help(),
    vector: (args) => {
        if (args.length === 2) {
            return create_vector(0, 0, args[0], args[1]);
        } else {
            return create_vector(args[0], args[1], args[2], args[3]);
        }
    },
    hide: (args) => {
        return hide(args[0]);
    },
    label: (args) => {
        return label(args[0], args[1]);
    },
    show: (args) => {
        return show(args[0]);
    },
    sin: function (a) {
        return Math.sin(a);
    },
    cos: function (a) {
        return Math.cos(a);
    },
    tan: function (a) {
        return Math.tan(a);
    },
    atan: function (a) {
        return Math.atan(a);
    },
    atan2: function (x, y) {
        return Math.atan2(x, y);
    },
}

export const hide = function (vector) {
    vector.visible = false;
    remove_vector_arrow(vector);
    return {description: `vector@${vector.id} is hidden`};
}

export const label = function (vector, text) {
    vector.label_text = text;
    update_label_text(vector.id, text);
    return `label set to ${text} on vector@${vector.id}`;
}

export const show = function (vector) {
    vector.visible = true;
    add_vector_arrow_to_svg(vector);
    return {description: `vector@${vector.id} is visible`};
}


const help = function () {
    return {
        description:
            `- vector(<x0>, <y0>, <x>, <y>): draws a vector from x0,y0 to x,y
                     - remove(<identifier>|<ref>): removes an object, 
                        a ref is @n where n is the reference number asigned to the object`
    }
}

export const create_vector = function (x0, y0, x, y) { //rename to create_vector
    const vector = {
        id: index_sequence++,
        x0: x0,
        y0: y0,
        x: x,
        y: y,
        is_visual: true,
        is_vector: true,         // for type comparison
        type: 'vector',          // for showing type to user
        is_new: true,            // to determine view action
        visible: true,
        toString: function () {
            return `vector@${this.id}{x0:${vector.x0},y0:${vector.y0} x:${vector.x},y:${vector.y}}`;
        },
        hide: function () {
            return hide(this);
        },
        label: function (text) {
            return label(this, text);
        },
        show: function () {
            return show(this);
        },
        equals: function (other) {
            return (this.id === other.id || (this.x0 === other.x0 && this.y0 === other.y0 && this.x === other.x && this.y === other.y));
        }
    };
    return vector;
}

export const multiplication = function (left, right) {
    const multiply = function (vector, scalar) {
        return create_vector(vector.x0 * scalar, vector.y0 * scalar, vector.x * scalar, vector.y * scalar
        );
    };

    if (left.is_vector && !right.is_vector) {
        return multiply(left, right);
    }
    if (right.is_vector && !left.is_vector) {
        return multiply(right, left);
    }
    return left * right;
}

export const division = function (left, right) {
    const divide = function (vector, scalar) {
        return create_vector(vector.x0 / scalar, vector.y0 / scalar, vector.x / scalar, vector.y / scalar);
    };

    if (left.is_vector && !right.is_vector) {
        return divide(left, right);
    }
    if (!left.is_vector && !right.is_vector) {
        return left / right;
    }
    throw {message: 'meaningless division'};
}

export const addition = function (left, right) {
    if (left && left.is_vector && right && right.is_vector) {
        return create_vector(left.x0 + right.x0, left.x0 + right.x0, left.x + right.x, left.y + right.y);
    }
    return left + right;
}

export const subtraction = function (left, right) {
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

export const test_equal = function (left, right) {
    if (left.is_vector && right.is_vector) {
        return left.equals(right);
    } else {
        return left === right;
    }
}

export const logical_and = function (left, right) {
    return left && right;
}

export const logical_or = function (left, right) {
    return left || right;
}