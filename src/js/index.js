import './scanner.js';
import './parser.js';
import {update_lazy_objects} from "./console";

/**
 * Main entry. draws the matrix
 */
const SVG_NS = 'http://www.w3.org/2000/svg'; // program needs these to create svg elements
let grid_size = 100; // this is the nr of pixels for the basis vector (1,0) (0,1)
let half_grid_size = grid_size >> 1; // used to position the grid lines
let vectors = []; // collection of added vectors
let moving_vector; // user can move vector arrows. when moving, this refers to the arrow
let width = window.innerWidth, height = window.innerHeight;
let origin_x = Math.floor((width / grid_size) / 2) * grid_size + half_grid_size,
    origin_y = Math.floor((height / grid_size) / 2) * grid_size + half_grid_size;
/**
 * Creates an svg element
 * @param element_type path,g, etc
 * @returns SVG element
 */
const create = function (element_type) {
    return document.createElementNS(SVG_NS, element_type);
}

/**
 * calculate the screen coordinates for grid values
 * @param x0 start_x
 * @param y0 start_y
 * @param x1 end_x
 * @param y1 end y
 * @returns {string} to put in an SVG path
 */
const calculate_d = function (x0, y0, x1, y1) {
    return create_d(origin_x + x0 * grid_size, origin_y - y0 * grid_size,
        +origin_x + x1 * grid_size, origin_y - y1 * grid_size);
}
/**
 * create a d attribute from screen coordinates
 * @param s_x0
 * @param s_y0
 * @param s_x1
 * @param s_y1
 * @returns {string}
 */
const create_d = function (s_x0, s_y0, s_x1, s_y1) {
    return "M" + s_x0 + " " + s_y0 + " L" + s_x1 + " " + s_y1;
}

/**
 * creates a SVG line (path)
 * @param x0 start_x
 * @param y0 start_y
 * @param x1 end_x
 * @param y1 end_y
 * @param css_class the css class to make up the element
 * @returns an SVG path element
 */
const create_line = function (x0, y0, x1, y1, css_class) {
    let path = create('path');
    path.setAttribute('d', create_d(x0, y0, x1, y1));
    path.setAttribute('class', css_class);
    return path;
}

/**
 * creates the arrow path element
 * @param id attribute
 * @param x0 start_x
 * @param y0 start_y
 * @param x1 end_x
 * @param y1 end_y
 * @param css_class class attribute
 * @returns {SVGPathElement}
 */
const arrow = function (id, x0, y0, x1, y1, css_class) {
    let path = create('path');

    path.setAttribute('d', calculate_d(x0, y0, x1, y1));
    path.id = id;
    path.setAttribute('class', css_class);
    path.setAttribute('marker-end', 'url(#arrow)');
    return path;
}

/**
 * Draws the background grid of the space
 * @param css_class class for the lines that are 'multiples of the basis vector'
 * @param bg_css_class class for in between lines
 * @returns {SVGGElement}
 */
const create_grid = function (css_class, bg_css_class) {
    const group = create('g');
    group.setAttribute('id', 'grid');
    const horizontal = create('g');
    horizontal.setAttribute('id', 'horizontal');
    for (let y = 0; y < height; y += grid_size) {
        horizontal.appendChild(create_line(0, y + half_grid_size, width, y + half_grid_size, css_class));
        horizontal.appendChild(create_line(0, y, width, y, bg_css_class));
    }
    group.appendChild(horizontal);
    const vertical = create('g');
    vertical.setAttribute('id', 'vertical');
    for (let x = 0; x < width; x += grid_size) {
        vertical.appendChild(create_line(x + half_grid_size, 0, x + half_grid_size, height, css_class));
        vertical.appendChild(create_line(x, 0, x, height, bg_css_class));
    }
    group.appendChild(vertical);
    return group;
}

/**
 * removes child from element by id if found
 * @param element
 * @param child_id id to remove
 */
const remove_child = function (element, child_id) {
    let node = element.firstChild;
    while (node && child_id !== node.id) {
        node = node.nextSibling;
    }
    if (node) {
        element.removeChild(node);
    }
}

/**
 * removes the grid from the DOM and adds an updated one.
 */
const redraw_grid = function () {
    remove_child(svg, "grid");
    svg.appendChild(create_grid('grid', 'bg-grid'));
    remove_child(svg, 'axes');
    svg.appendChild(create_axes());
}

export const update_vector_arrow = function (id, vector) {
    let d = calculate_d(vector.x0, vector.y0, vector.x, vector.y);
    document.getElementById(id).setAttribute('d', d);
}
/**
 * Adds a vector to the set.
 * @param vector
 */
export const add_vector = function (vector) {
    vector.id = vectors.length;
    vectors.push(vector);
    add_vector_to_group(vector);

    vector.add = (other) => add_vector({
        x0: vector.x0 + other.x0,
        y0: vector.x0 + other.x0,
        x: vector.x + other.x,
        y: vector.y + other.y
    });
    vector.multiply = (scalar) => add_vector({
        x0: vector.x0 * scalar,
        y0: vector.y0 * scalar,
        x: vector.x * scalar,
        y: vector.y * scalar
    });
    vector.is_vector = true;
    vector.type = () => 'vector';
    return { //object_wrapper
        type: 'vector',
        object: vector,
        description: `vector@${vector.id}{x0:${vector.x0},y0:${vector.y0} x:${vector.x},y:${vector.y}}`,
    };

}

export const remove_vector = function (vector_or_index) {
    let index;
    if (vector_or_index.is_vector) {
        for (let i = 0; i < vectors.length; i++) {
            if (vectors[i].id === vector_or_index.id) {
                index = i;
                break;
            }
        }
    } else {
        index = vector_or_index;
    }

    if (!vectors[index]) {
        throw {message: `vector@${index} not found`};
    }

    vectors.splice(index, 1);
    remove_child(document.getElementById('vectors'), index.toString());
    return {description: `vector@${index} removed`};
}

/**
 * The moving operation. Called by onmousemove on the svg ('canvas')
 * @param event
 */
const move_vector = function (event) {
    if (moving_vector) {
        let current_x = event.clientX;
        let current_y = event.clientY;
        vectors[moving_vector.id].x = (current_x - origin_x) / grid_size;
        vectors[moving_vector.id].y = (origin_y - current_y) / grid_size;
        moving_vector.setAttribute('d', create_d(origin_x, origin_y, current_x, current_y));
    }
}

/**
 * Draws all the vectors.
 *
 * vector {
 *     x0,y0 origin
 *     x,y coordinates
 * }
 */
const draw_vectors = function () {
    const vector_group = create_vector_group();

    for (let i = 0; i < vectors.length; i++) {
        add_vector_to_group(vectors[i], vector_group);
    }
    svg.appendChild(vector_group);
}

const add_vector_to_group = function (vector, vector_group) {
    if (!vector_group) {
        vector_group = document.getElementById('vectors');
    }
    if (!vector_group) {
        vector_group = create_vector_group();
    }
    let vector_arrow = arrow(vector.id, vector.x0, vector.y0, vector.x, vector.y,
        'vector');
    vector_arrow.onmousedown = function start_moving_vector(event) {
        moving_vector = event.target;
    };
    vector_group.appendChild(vector_arrow);
}

const create_vector_group = function () {
    const vector_group = create("g");
    vector_group.id = 'vectors';
    svg.appendChild(vector_group);
    return vector_group;
}

/**
 * Removes all vectors in the svg and calls draw_vectors to draw updated versions.
 */
const redraw_vectors = function () {
    remove_child(svg, 'vectors');
    draw_vectors();
}

/**
 * (re)draws all
 */
const redraw = function () {
    redraw_grid();
    redraw_vectors();
}

const create_axes = function () {
    let axes_group = create('g');
    axes_group.setAttribute('id', 'axes');
    let x = create_line(0, origin_y, width, origin_y, 'axis');
    x.id = 'x-axis';
    axes_group.appendChild(x);
    let y = create_line(origin_x, 0, origin_x, height, 'axis');
    y.id = 'y-axis';
    axes_group.appendChild(y);
    return axes_group;
}

/**
 * setup the arrow head for the vector
 * @returns {SVGDefsElement}
 */
function create_defs() {
    let defs = create('defs');
    let marker = create('marker');
    marker.id = 'arrow';
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('markerWidth', '3');
    marker.setAttribute('markerHeight', '4');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '5');
    let polyline = create('polyline');
    polyline.setAttribute('points', '0,0 10,5 0,10 1,5');
    polyline.setAttribute('fill', 'yellow');
    marker.appendChild(polyline);
    defs.appendChild(marker);
    return defs;
}

/**
 * Creates the SVG
 * @returns {SVGElement}
 */
const create_svg = function () {
    let svg = create('svg');

    svg.onmousemove = move_vector;
    svg.onmouseup = function stop_moving_vector() {
        moving_vector = undefined;
        update_lazy_objects();
    };

    let defs = create_defs();
    svg.appendChild(defs);
    return svg;
}

document.body.onresize = function recalculate_window_dimensions() {
    width = window.innerWidth;
    height = window.innerHeight;
    origin_x = Math.floor((width / grid_size) / 2) * grid_size + half_grid_size;
    origin_y = Math.floor((height / grid_size) / 2) * grid_size + half_grid_size;
    redraw();
}

const svg = create_svg();
document.body.appendChild(svg);

svg.appendChild(create_grid('grid', 'bg-grid'));
svg.appendChild(create_axes());
