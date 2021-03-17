import {update_visible_objects} from "./index";

let vectors_by_id = {};
let matrices_by_id = {};
const SVG_NS = 'http://www.w3.org/2000/svg'; // program needs these to create svg elements
let grid_size = 100; // this is the nr of pixels for the basis vector (1,0) (0,1)
let half_grid_size = grid_size >> 1; // used to position the grid lines
const slider = document.getElementById('slider');
const console_element = document.getElementById('console');
let moving_vector; // user can move vector arrows. when moving, this refers to the arrow
let window_width = window.innerWidth, window_height = window.innerHeight;
let origin_x = Math.floor((window_width / grid_size) / 2) * grid_size + half_grid_size,
    origin_y = Math.floor((window_height / grid_size) / 2) * grid_size + half_grid_size;
let slider_start_Y, slider_start_height;
/**
 * Creates an svg element
 * @param element_type path,g, etc
 * @returns SVG element
 */
const create_svg_element = function (element_type) {
    return document.createElementNS(SVG_NS, element_type);
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
 * calculate the screen coordinates for grid values
 * @param x0 start_x
 * @param y0 start_y
 * @param x1 end_x
 * @param y1 end y
 * @returns {string} to put in an SVG path
 */
const calculate_d = function (x0, y0, x1, y1) {
    return create_d(calc_screen_x(x0), calc_screen_y(y0), calc_screen_x(x1), calc_screen_y(y1));
}

const calc_screen_x = function (x) {
    return origin_x + x * grid_size;
}

const calc_screen_y = function (y) {
    return origin_y - y * grid_size;
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
    let path = create_svg_element('path');
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
 * @param arrow_def SVG definition of the arrow head
 * @returns {SVGPathElement}
 */
const create_arrow = function (id, x0, y0, x1, y1, css_class, arrow_def) {
    let path = create_svg_element('path');

    path.setAttribute('d', calculate_d(x0, y0, x1, y1));
    path.id = id;
    path.setAttribute('class', css_class);
    path.setAttribute('marker-end', arrow_def);
    return path;
}

export const remove_vector_arrow = function (vector) {
    delete vectors_by_id[vector.id];
    remove_child(document.getElementById('vectors'), vector.id.toString());
    remove_child(document.getElementById('vectors'), "l" + vector.id.toString()); //
}

/**
 * Draws the background grid of the space
 * @param css_class class for the lines that are 'multiples of the basis vector'
 * @param bg_css_class class for in between lines
 * @returns {SVGGElement}
 */
export const create_grid = function (css_class, bg_css_class) {
    const group = create_svg_element('g');
    group.setAttribute('id', 'grid');
    const horizontal = create_svg_element('g');
    horizontal.setAttribute('id', 'horizontal');
    for (let y = 0; y < window_height; y += grid_size) {
        horizontal.appendChild(create_line(0, y + half_grid_size, window_width, y + half_grid_size, css_class));
        horizontal.appendChild(create_line(0, y, window_width, y, bg_css_class));
    }
    group.appendChild(horizontal);
    const vertical = create_svg_element('g');
    vertical.setAttribute('id', 'vertical');
    for (let x = 0; x < window_width; x += grid_size) {
        vertical.appendChild(create_line(x + half_grid_size, 0, x + half_grid_size, window_height, css_class));
        vertical.appendChild(create_line(x, 0, x, window_height, bg_css_class));
    }
    group.appendChild(vertical);
    return group;
}


function create_label(vector, color) {
    let label = create_svg_element('text');
    label.setAttribute('x', (calc_screen_x(vector.x) - 5).toString());
    label.setAttribute('y', (calc_screen_y(vector.y) + 15).toString());
    label.setAttribute('fill', color);
    label.setAttribute('id', 'l' + vector.id);
    let text_node = document.createTextNode(vector.label_text);
    label.appendChild(text_node);
    return label;
}

const update_label = function (id, new_id, x, y) {
    let label = document.getElementById('l' + id);
    label.setAttribute('x', x.toString());
    label.setAttribute('y', y.toString());
    label.id = 'l' + new_id;
}

export const update_label_text = function (id, text) {
    if (text) {
        let label = document.getElementById('l' + id);
        label.firstChild.textContent = text;
    }
}

export const add_vector_arrow_to_svg = function (vector) {
    let vector_group = get_or_create_vector_group();
    let vector_arrow = create_arrow(vector.id, vector.x0, vector.y0, vector.x, vector.y, 'vector', 'url(#vector_arrow)');
    vector_arrow.onmousedown = function start_moving_vector(event) {
        moving_vector = event.target;

        window.onmousemove = move;

        window.onmouseup = function () {
            window.onmousemove = undefined;
            window.onmouseup = undefined;
        };
    };
    vector_group.appendChild(vector_arrow);

    let label = create_label(vector, 'yellow');
    vector_group.appendChild(label);
}

export const add_matrix_to_svg = function (matrix) {
    let matricesGroup = get_or_create_matrices_group();
    let vector_arrow_i = create_arrow(matrix.id, 0, 0, matrix.row(0)[0], matrix.row(0)[1], 'matrix i', 'url(#matrix_i_arrow)');
    let vector_arrow_j = create_arrow(matrix.id, 0, 0, matrix.row(1)[0], matrix.row(1)[1], 'matrix j', 'url(#matrix_j_arrow)');
    matricesGroup.appendChild(vector_arrow_i);
    matricesGroup.appendChild(vector_arrow_j);

    matricesGroup.appendChild(create_label({
        x: matrix.row(0)[0],
        y: matrix.row(0)[1],
        id: matrix.id + "i",
        label_text: 'i'
    }, 'green'));
    matricesGroup.appendChild(create_label({
        x: matrix.row(1)[0],
        y: matrix.row(1)[1],
        id: matrix.id + "j",
        label_text: 'j'
    }, 'red'));
}


/**
 * Draws all the vectors.
 */
const draw_vectors = function () {
    const vector_group = get_or_create_vector_group();

    let vectors = Object.values(vectors_by_id);
    for (let i = 0; i < vectors.length; i++) {
        if (vectors[i].visible) {
            add_vector_arrow_to_svg(vectors[i]);
        }
    }
    svg.appendChild(vector_group);
}

/**
 * Draws all the matrices.
 */
const draw_matrices = function () {
    const matrices_group = get_or_create_matrices_group();

    let matrices = Object.values(matrices_by_id);
    for (let i = 0; i < matrices.length; i++) {
        if (matrices[i].visible) {
            add_matrix_to_svg(matrices[i]);
        }
    }
    svg.appendChild(matrices_group);
}

const get_or_create_vector_group = function () {
    let vector_group = document.getElementById('vectors');
    if (vector_group === null || vector_group === undefined) {
        vector_group = create_svg_element("g");
        svg.appendChild(vector_group);
        vector_group.id = 'vectors';
    }

    return vector_group;
}

const get_or_create_matrices_group = function () {
    let matrices_group = document.getElementById('matrices');
    if (matrices_group === null || matrices_group === undefined) {
        matrices_group = create_svg_element("g");
        svg.appendChild(matrices_group);
        matrices_group.id = 'matrices';
    }

    return matrices_group;
}

/**
 * Removes all vectors in the svg and calls draw_vectors to draw updated versions.
 */
const redraw_vectors = function () {
    remove_child(svg, 'vectors');
    draw_vectors();
}

/**
 * Removes all vectors in the svg and calls draw_vectors to draw updated versions.
 */
const redraw_matrices = function () {
    remove_child(svg, 'matrices');
    draw_matrices();
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

export const update_vector_arrow = function (existing_id, new_vector) {
    let d = calculate_d(new_vector.x0, new_vector.y0, new_vector.x, new_vector.y);
    let arrow = document.getElementById(existing_id.toString());
    if (arrow) {
        arrow.setAttribute('d', d);
        arrow.id = new_vector.id;
        update_label(existing_id, new_vector.id, calc_screen_x(new_vector.x) + 5, calc_screen_y(new_vector.y) + 5);
    } else {
        add_vector_arrow_to_svg(new_vector);
    }
    delete vectors_by_id[existing_id];
    vectors_by_id[new_vector.id] = new_vector;
}

/**
 * (re)draws all
 */
export const redraw = function () {
    redraw_grid();
    redraw_vectors();
    redraw_matrices();
}

const create_axes = function () {
    let axes_group = create_svg_element('g');
    axes_group.setAttribute('id', 'axes');
    let x = create_line(0, origin_y, window_width, origin_y, 'axis');
    x.id = 'x-axis';
    axes_group.appendChild(x);
    let y = create_line(origin_x, 0, origin_x, window_height, 'axis');
    y.id = 'y-axis';
    axes_group.appendChild(y);
    return axes_group;
}

/**
 * setup the arrow head for the vector
 * @returns {SVGDefsElement}
 */
const create_defs = function (type, color) {
    let defs = create_svg_element('defs');
    let marker = create_svg_element('marker');
    marker.id = type;
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('markerWidth', '3');
    marker.setAttribute('markerHeight', '4');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '5');
    let polyline = create_svg_element('polyline');
    polyline.setAttribute('points', '0,0 10,5 0,10 1,5');
    polyline.setAttribute('fill', color);
    marker.appendChild(polyline);
    defs.appendChild(marker);
    return defs;
}

const move = function (event) {
    let current_x = event.offsetX;
    let current_y = event.offsetY;
    let vector = vectors_by_id[parseInt(moving_vector.id)];
    if (vector) {
        vector.x = (current_x - origin_x) / grid_size;
        vector.y = (origin_y - current_y) / grid_size;
        moving_vector.setAttribute('d', create_d(origin_x, origin_y, current_x, current_y));
        update_label(moving_vector.id, moving_vector.id, current_x + 5, current_y + 5);
        update_visible_objects();
    }
}

/**
 * Creates the SVG
 * @returns {SVGElement}
 */
const create_svg = function () {
    let svg = create_svg_element('svg');

    svg.onmousemove = move;
    svg.onmouseup = function stop_moving() {
        moving_vector = undefined;
    };

    svg.appendChild(create_defs('vector_arrow', 'yellow'));
    svg.appendChild(create_defs('matrix_i_arrow', 'green'));
    svg.appendChild(create_defs('matrix_j_arrow', 'red'));
    return svg;
}

export const add_vector_arrow = function (vector) {
    vectors_by_id[vector.id] = vector;
    add_vector_arrow_to_svg(vector);
}

export const add_matrix_view = function (matrix) {
    matrices_by_id[matrix.id] = matrix;
    add_matrix_to_svg(matrix);
}

document.body.onresize = function recalculate_window_dimensions() {
    window_width = window.innerWidth;
    window_height = window.innerHeight;
    origin_x = Math.floor((window_width / grid_size) / 2) * grid_size + half_grid_size;
    origin_y = Math.floor((window_height / grid_size) / 2) * grid_size + half_grid_size;
    redraw();
}

const svg = create_svg();
document.body.appendChild(svg);
svg.appendChild(create_grid('grid', 'bg-grid'));
svg.appendChild(create_axes());
get_or_create_vector_group();
get_or_create_matrices_group();

slider.onmousedown = function (event) {
    slider_start_Y = event.clientY;
    slider_start_height = parseInt(document.defaultView.getComputedStyle(console_element).height, 10);

    window.onmousemove = function (event) {
        console_element.style.height = (slider_start_height - (event.clientY - slider_start_Y)) + 'px';
    }

    window.onmouseup = function () {
        window.onmousemove = undefined;
        window.onmouseup = undefined;
    };
};
